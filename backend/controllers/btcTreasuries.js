import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import stringSimilarity from 'string-similarity';
import { scrapeEtfHoldingsFromSite } from './btcEtfsController.js';
import { scrapeCountryBreakdownFromSite as scrapeAllBreakdownFromSite } from './btcCountriesController.js';

// --- Logging Setup ---
import winston from 'winston';
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// --- DB Setup and Migrations ---
import mysql from 'mysql2/promise';
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Ensure dividend_rate column exists
try {
  const [columns] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'dividend_rate'
  `, [process.env.DB_NAME, 'bitcoin_treasuries']);
  if (columns.length === 0) {
    await db.execute(`ALTER TABLE bitcoin_treasuries ADD COLUMN dividend_rate VARCHAR(20)`);
    console.log('[🆕] Added dividend_rate column to bitcoin_treasuries');
  }
} catch (err) {
  console.error('[❌] Failed to check/add dividend_rate column:', err.message);
}

// Ensure normalized_company_name column exists
try {
  const [columns] = await db.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'normalized_company_name'
  `, [process.env.DB_NAME, 'bitcoin_treasuries']);
  if (columns.length === 0) {
    await db.execute(`ALTER TABLE bitcoin_treasuries ADD COLUMN normalized_company_name VARCHAR(255)`);
    console.log('[🆕] Added normalized_company_name column to bitcoin_treasuries');
  }
} catch (err) {
  console.error('[❌] Failed to check/add normalized_company_name column:', err.message);
}

// Ensure unique index on normalized_company_name
try {
  const [indexes] = await db.execute(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'normalized_company_name' AND NON_UNIQUE = 0
  `, [process.env.DB_NAME, 'bitcoin_treasuries']);
  if (indexes.length === 0) {
    await db.execute(`ALTER TABLE bitcoin_treasuries ADD UNIQUE INDEX idx_normalized_company_name (normalized_company_name)`);
    console.log('[🆕] Added unique index on normalized_company_name');
  }
} catch (err) {
  console.error('[❌] Failed to check/add unique index on normalized_company_name:', err.message);
}

// List of user agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// --- Helper Functions ---

// Scrape all public companies from https://bitcointreasuries.net/
export async function scrapeCompanyTreasuriesFromSite() {
  if (!process.env.SCRAPERAPI_KEY) {
    throw new Error('SCRAPERAPI_KEY is not defined in environment variables');
  }
  const response = await axios.get('https://api.scraperapi.com/', {
    params: {
      api_key: process.env.SCRAPERAPI_KEY,
      url: 'https://bitcointreasuries.net/',
      output_format: 'json',
      autoparse: 'true'
    }
  });

  // Log the full ScraperAPI response body
  console.log("ScraperAPI response:", response.data);

  const html = response.data;
  if (!html || typeof html !== 'string') {
    logger.error('[❌] Unexpected ScraperAPI response format: %s', JSON.stringify(response.data));
    throw new Error('Invalid response from ScraperAPI');
  }

  const $ = cheerio.load(html);
  const rows = $('table tr').slice(1); // Skip header row
  const parsedCompanies = [];
  const seenNormalizedNames = new Set();

  rows.each((i, row) => {
    const cells = $(row).find('td');
    if (cells.length < 12) return;

    const name = $(cells[0]).text().trim();
    const symbol = $(cells[1]).text().trim();
    const market_cap = $(cells[2]).text().trim();
    const ent_value = $(cells[3]).text().trim();
    const btc = $(cells[4]).text().trim();
    const btc_per_share = $(cells[5]).text().trim();
    const cost_basis = $(cells[6]).text().trim();
    const usd_value = $(cells[7]).text().trim();
    const ngu = $(cells[8]).text().trim();
    const mnav = $(cells[9]).text().trim();
    const mcap_ratio = $(cells[10]).text().trim();
    const ratio_21m = $(cells[11]).text().trim();

    const normalizedName = normalizeCompanyName(name);
    if (!normalizedName || seenNormalizedNames.has(normalizedName)) return;
    seenNormalizedNames.add(normalizedName);

    parsedCompanies.push({
      company_name: name,
      normalized_company_name: normalizedName,
      country: 'Unknown',
      btc_holdings: btc,
      usd_value: usd_value,
      entity_type: 'Public Company',
      entity_url: null,
      last_updated: null,
      ticker: symbol,
      exchange: null,
      ticker_status: null,
      dividend_rate: null,
      last_verified: null,
      market_cap,
      enterprise_value: ent_value,
      btc_per_share,
      cost_basis,
      ngu,
      mnav,
      mcap_ratio,
      ratio_21m
    });
  });

  // Log the number of companies parsed
  console.log("Parsed companies count:", parsedCompanies.length);

  // Insert the transformed data into bitcoin_treasuries table
  for (const c of parsedCompanies) {
    try {
      await db.execute(
        `INSERT INTO bitcoin_treasuries
          (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, last_updated, ticker, exchange, ticker_status, dividend_rate, last_verified,
           market_cap, enterprise_value, btc_per_share, cost_basis, ngu, mnav, mcap_ratio, ratio_21m)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           country=VALUES(country),
           btc_holdings=VALUES(btc_holdings),
           usd_value=VALUES(usd_value),
           entity_url=VALUES(entity_url),
           last_updated=NOW(),
           ticker=VALUES(ticker),
           exchange=VALUES(exchange),
           ticker_status=VALUES(ticker_status),
           dividend_rate=VALUES(dividend_rate),
           last_verified=VALUES(last_verified),
           market_cap=VALUES(market_cap),
           enterprise_value=VALUES(enterprise_value),
           btc_per_share=VALUES(btc_per_share),
           cost_basis=VALUES(cost_basis),
           ngu=VALUES(ngu),
           mnav=VALUES(mnav),
           mcap_ratio=VALUES(mcap_ratio),
           ratio_21m=VALUES(ratio_21m)`,
        [
          c.company_name,
          c.normalized_company_name,
          c.country,
          c.btc_holdings,
          c.usd_value,
          c.entity_url,
          c.last_updated,
          c.ticker,
          c.exchange,
          c.ticker_status,
          c.dividend_rate,
          c.last_verified,
          c.market_cap,
          c.enterprise_value,
          c.btc_per_share,
          c.cost_basis,
          c.ngu,
          c.mnav,
          c.mcap_ratio,
          c.ratio_21m
        ]
      );
      logger.info("Inserted company: %s", c.company_name);
    } catch (err) {
      logger.error("Failed to insert company: %s, error: %s", c.company_name, err.message);
    }
  }

  return parsedCompanies;
}


// For compatibility, keep the original function for API usage, but use the new one.
export async function scrapeCompaniesFromWebsite() {
  // This is now a wrapper for public companies only.
  return await scrapeCompanyTreasuriesFromSite();
}

// Enhance companies with OpenAI - returns enhanced company entries
export async function enhanceCompaniesWithOpenAI(companies) {
  try {
    console.log('[🤖] Enhancing with OpenAI to detect additional companies...');
    const companyNames = companies.map(c => c.companyName).join(', ');
    const openaiPrompt = `
      The following is a list of companies already scraped as Bitcoin holders:
      ${companyNames}
      Please name any additional public companies (not already listed) known to hold significant Bitcoin in their treasuries as of today. List each with their name, country, approximate BTC holdings, USD value, and a public URL if available.
    `;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: openaiPrompt }],
      temperature: 0.2
    });
    const additionalCompaniesText = completion.choices[0].message.content;
    console.log('[📬] OpenAI returned additional companies:\n', additionalCompaniesText);
    const additionalCompanies = additionalCompaniesText.split('\n').map(line => {
      const match = line.match(/(.+?) \((.+?)\): ([\d.,]+) BTC, (.+?) USD, (https?:\/\/[^\s)]+)/);
      if (!match) return null;
      return {
        companyName: match[1].trim(),
        country: match[2].trim(),
        btcHoldings: match[3].trim(),
        usdValue: match[4].trim(),
        entityUrl: match[5].trim(),
        entityType: 'Public Company (OpenAI)'
      };
    }).filter(Boolean);
    // Only add if not already present
    const newCompanies = [];
    for (const company of additionalCompanies) {
      if (!companies.find(c => normalizeCompanyName(c.companyName) === normalizeCompanyName(company.companyName))) {
        newCompanies.push(company);
        console.log(`[💡] Added from OpenAI: ${company.companyName}`);
      }
    }
    return companies.concat(newCompanies);
  } catch (err) {
    console.error('[❌] Failed OpenAI enhancement:', err.message);
    return companies;
  }
}

// Sort, validate, deduplicate, and insert companies into DB
export async function processAndSaveCompanies(companies, connection = db) {
  // Helper to parse BTC holdings for sorting
  const parseBTC = (val) => parseFloat(val.replace(/[^\d.-]/g, '').replace(',', '')) || 0;
  companies = companies.filter(isValidCompany);
  companies = dedupeCompanies(companies);
  console.log('[🔍] Parsed and deduped company rows:', companies.length);
  try {
    await connection.beginTransaction();
    await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
    for (const company of companies) {
      const resolvedTicker = await resolveTickerInfo(company.companyName);
      let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
      if (dividendRate == null) {
        dividendRate = await resolveDividendRateAI(company.companyName);
      }
      const normalizedName = normalizeCompanyName(company.companyName);
      await connection.execute(
        'INSERT INTO bitcoin_treasuries (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, ticker_status, dividend_rate) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE ' +
        'company_name = VALUES(company_name), ' +
        'country = VALUES(country), ' +
        'btc_holdings = VALUES(btc_holdings), ' +
        'usd_value = VALUES(usd_value), ' +
        'entity_url = VALUES(entity_url), ' +
        'ticker = VALUES(ticker), ' +
        'exchange = VALUES(exchange), ' +
        'ticker_status = VALUES(ticker_status), ' +
        'dividend_rate = VALUES(dividend_rate), ' +
        'last_updated = NOW()',
        [
          company.companyName,
          normalizedName,
          company.country,
          company.btcHoldings,
          company.usdValue,
          company.entityUrl,
          resolvedTicker.ticker,
          resolvedTicker.exchange,
          resolvedTicker.status,
          dividendRate
        ]
      );
    }
    await removeDuplicateTreasuries(connection);
    await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('[❌] Transaction failed:', err.message);
    throw err;
  }
  // Sort all companies by btcHoldings descending
  const sortedCompanies = companies.sort((a, b) => parseBTC(b.btcHoldings) - parseBTC(a.btcHoldings));
  return sortedCompanies;
}

// Normalize company names
function normalizeCompanyName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/\b(inc\.?|incorporated|corp\.?|corporation|llc|limited)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// Validate company data
function isValidCompany(company) {
  return (
    company.companyName &&
    typeof company.companyName === 'string' &&
    company.btcHoldings &&
    !isNaN(parseFloat(company.btcHoldings.replace(/[^\d.-]/g, ''))) &&
    company.country &&
    typeof company.country === 'string'
  );
}

// Deduplicate companies using fuzzy matching
function dedupeCompanies(companies) {
  const unique = [];
  const seen = new Set();
  for (const company of companies) {
    const normalized = normalizeCompanyName(company.companyName);
    if (!normalized) continue;
    if (!Array.from(seen).some(seenName => stringSimilarity.compareTwoStrings(normalized, seenName) > 0.9)) {
      unique.push(company);
      seen.add(normalized);
    }
  }
  return unique;
}

// Remove duplicate database entries
async function removeDuplicateTreasuries(connection = db) {
  try {
    await connection.execute(
      'DELETE t1 FROM bitcoin_treasuries t1 ' +
      'INNER JOIN bitcoin_treasuries t2 ON t1.normalized_company_name = t2.normalized_company_name AND t1.id > t2.id'
    );
    console.log('[🧹] Removed duplicate treasury entries');
  } catch (err) {
    console.error('[❌] Failed to remove duplicate treasury entries:', err.message);
  }
}

// Resolve ticker info
async function resolveTickerInfo(companyName) {
  try {
    const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
      params: { q: companyName, quotesCount: 1, newsCount: 0 }
    });
    if (response.data?.quotes?.length > 0) {
      const quote = response.data.quotes[0];
      const ticker = quote.symbol || '';
      const exchange = quote.exchange || '';
      const ticker_status = ticker ? 'valid' : 'not_found';
      return { ticker, exchange, status: ticker_status };
    }
    return { ticker: '', exchange: '', status: 'not_found' };
  } catch (err) {
    console.error(`[❌] Error resolving ticker for ${companyName}:`, err.message);
    return { ticker: '', exchange: '', status: 'invalid' };
  }
}

// Fetch dividend rate via OpenAI only (Yahoo Finance bypassed)
async function resolveDividendRateYahoo(ticker) {
  // Delegate to OpenAI instead of Yahoo Finance
  return await resolveDividendRateAI(ticker);
}

// Fallback to OpenAI for dividend rate
async function resolveDividendRateAI(companyName) {
  try {
    const prompt =
      `Does the company "${companyName}" pay regular dividends? ` +
      `If yes, provide the current forward dividend rate per share in US dollars (e.g., "1.25"). ` +
      `If no, reply with "No Dividends". Respond with only the number or "No Dividends".`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    });
    const content = completion.choices[0].message.content.trim();
    return isNaN(parseFloat(content)) ? 'No Dividends' : content;
  } catch (err) {
    console.error(`[❌] OpenAI dividend rate fetch failed for ${companyName}:`, err.message);
    return 'No Dividends';
  }
}

// --- API Endpoints ---

// GET /api/bitcoin-treasuries
export const getBitcoinTreasuries = async (req, res) => {
  console.log('[⚙️] getBitcoinTreasuries called at', new Date().toISOString());
  console.log('[🕵️‍♂️] Request IP:', req.ip);
  try {
    // Helper to parse BTC holdings for sorting
    const parseBTC = (val) => parseFloat(val.replace(/[^\d.-]/g, '').replace(',', '')) || 0;

    // Check cache
    let cachedRows = [];
    try {
      cachedRows = await executeQuery(
        'SELECT company_name, btc_holdings, usd_value, entity_url, ticker, market_cap, enterprise_value, btc_per_share, cost_basis, ngu, mnav, mcap_ratio, ratio_21m ' +
        'FROM bitcoin_treasuries ORDER BY btc_holdings DESC'
      );
      console.log(`[📊] Found ${cachedRows.length} cached rows`);
    } catch (err) {
      console.error('[❌] Failed to query cached Bitcoin treasury companies:', err.message);
    }

    if (cachedRows.length >= 0) {
      const cachedCompanies = cachedRows.map(row => ({
        company_name: row.company_name,
        btc_holdings: row.btc_holdings,
        usd_value: row.usd_value,
        entity_url: row.entity_url,
        ticker: row.ticker,
        market_cap: row.market_cap,
        enterprise_value: row.enterprise_value,
        btc_per_share: row.btc_per_share,
        cost_basis: row.cost_basis,
        ngu: row.ngu,
        mnav: row.mnav,
        mcap_ratio: row.mcap_ratio,
        ratio_21m: row.ratio_21m
      }));
      // Sort cached data by btcHoldings descending
      const sortedCachedCompanies = cachedCompanies.sort((a, b) => parseBTC(b.btc_holdings) - parseBTC(a.btc_holdings));
      console.log(`[📬] Returning ${sortedCachedCompanies.length} sorted cached companies`);
      return res.json(sortedCachedCompanies);
    }

    // If no cache and not forced, return empty list
    if (req.query.force !== 'true') {
      console.log('[⏳] No cached data and force flag not set — skipping scrape');
      return res.json([]);
    }

    // Clear outdated cache
    try {
      await executeQuery(
        'DELETE FROM bitcoin_treasuries WHERE last_updated <= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      console.log('[🧹] Cleared outdated cache entries');
    } catch (err) {
      console.error('[❌] Failed to clear outdated cache entries:', err.message);
    }

    // Scrape companies
    let companies = await scrapeCompaniesFromWebsite();
    // Enhance with OpenAI
    companies = await enhanceCompaniesWithOpenAI(companies);
    // Sort, validate, dedupe, insert to DB
    const sortedCompanies = await processAndSaveCompanies(companies);
    console.log(`[📊] Returning ${sortedCompanies.length} unique and BTC-sorted companies`);
    return res.json(sortedCompanies);
  } catch (err) {
    console.error('[❌] Bitcoin treasuries fetch error:', err.message);
    console.error('[🐛] Full error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin treasury data' });
  }
};




// POST /api/bitcoin-treasuries/run-openai
export const runOpenAIUpdate = async (req, res) => {
  console.log('[🚀] Manual OpenAI update triggered at', new Date().toISOString());
  try {
    const companyListResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a financial research assistant who tracks Bitcoin holdings by public companies.'
        },
        {
          role: 'user',
          content: `Provide a list of public companies that hold Bitcoin in their corporate treasuries as of today.
List each company name, country, estimated BTC holdings, estimated USD value, and link to their official treasury or investor page if available.`
        }
      ],
      temperature: 0.2
    });

    const openAIText = companyListResponse.choices[0].message.content;
    console.log('[📥] OpenAI response received');

    const parsedCompanies = openAIText
      .split('\n')
      .map(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 5 || !parts[0] || parts[0].startsWith('#')) return null;
        return {
          companyName: parts[0],
          country: parts[1],
          btcHoldings: parts[2],
          usdValue: parts[3],
          entityUrl: parts[4],
          entityType: 'Public Company'
        };
      })
      .filter(isValidCompany);

    // Deduplicate
    const companies = dedupeCompanies(parsedCompanies);
    console.log(`[🧠] Parsed and deduped ${companies.length} companies from OpenAI response`);

    // Insert with transaction
    const connection = db;
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
      for (const company of companies) {
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        await connection.execute(
          'INSERT IGNORE INTO countries (country_name) VALUES (?)',
          [company.country]
        );
        let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(company.companyName);
        }
        const normalizedName = normalizeCompanyName(company.companyName);
        await connection.execute(
          'INSERT INTO bitcoin_treasuries (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'ticker = VALUES(ticker), ' +
          'exchange = VALUES(exchange), ' +
          'ticker_status = VALUES(ticker_status), ' +
          'dividend_rate = VALUES(dividend_rate), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            normalizedName,
            company.country,
            company.usdValue,         // <-- swapped
            company.btcHoldings,      // <-- swapped
            company.entityUrl,
            company.entityType,
            resolvedTicker.ticker,
            resolvedTicker.exchange,
            resolvedTicker.status,
            dividendRate
          ]
        );
      }
      await removeDuplicateTreasuries(connection);
      await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[❌] Transaction failed:', err.message);
      throw err;
    }

    // Update countries table
    console.log('[🔄] Updating countries table with aggregate BTC/USD totals');
    const breakdownRows = await executeQuery(
      `
      SELECT country,
             SUM(CAST(REPLACE(REPLACE(btc_holdings, ',', ''), ' BTC', '') AS DECIMAL(20,4))) AS total_btc,
             SUM(CAST(REPLACE(REPLACE(usd_value, ',', ''), '$', '') AS DECIMAL(20,4))) / 1000000 AS total_usd_m
      FROM bitcoin_treasuries
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country
      `
    );
    for (const row of breakdownRows) {
      await executeQuery(
        'INSERT INTO countries (country_name, total_btc, total_usd_m) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE total_btc = VALUES(total_btc), total_usd_m = VALUES(total_usd_m)',
        [row.country, row.total_btc, row.total_usd_m]
      );
    }

    return res.status(200).json({ message: `OpenAI update completed with ${companies.length} entries` });
  } catch (err) {
    console.error('[❌] Failed OpenAI update:', err.message);
    return res.status(500).json({ error: 'OpenAI update failed' });
  }
};

// POST /api/bitcoin-treasuries/manual-scrape
export const runManualScrape = async (req, res) => {
  console.log('[🛠️] Manual scrape triggered at', new Date().toISOString());
  try {
    // Scrape public companies, ETFs/trusts, and country breakdown using helper functions
    const publicCompanies = await scrapeCompanyTreasuriesFromSite();
    const etfsAndTrusts = await scrapeEtfHoldingsFromSite();
    const countryBreakdown = await scrapeCountryBreakdownFromSite();
    console.log('[📋] Full scraped country breakdown response:', JSON.stringify(countryBreakdown, null, 2));
    console.log('[🌍] Country Breakdown API Response:', countryBreakdown);
    console.log(`[ℹ️] Scraped ${publicCompanies.length} public companies from site`);
    console.log(`[ℹ️] Scraped ${etfsAndTrusts.length} ETFs/Trusts from site`);
    console.log(`[ℹ️] Scraped ${countryBreakdown.length} country breakdown rows`);

    // Validate and deduplicate
    let companies = publicCompanies.filter(isValidCompany);
    let etfs = etfsAndTrusts.filter(isValidCompany);
    companies = dedupeCompanies(companies);
    etfs = dedupeCompanies(etfs);
    console.log(`[✅] Validated and deduped to ${companies.length} public companies`);
    console.log(`[✅] Validated and deduped to ${etfs.length} ETFs/Trusts`);

    // Insert companies and ETFs into bitcoin_treasuries table, tagging with correct entityType
    const connection = db;
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
      // Insert public companies
      for (const company of companies) {
        const entityType = 'Public Company';
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(company.companyName);
        }
        const normalizedName = normalizeCompanyName(company.companyName);
        await connection.execute(
          'INSERT INTO bitcoin_treasuries (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'ticker = VALUES(ticker), ' +
          'exchange = VALUES(exchange), ' +
          'ticker_status = VALUES(ticker_status), ' +
          'dividend_rate = VALUES(dividend_rate), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            normalizedName,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            entityType,
            resolvedTicker.ticker,
            resolvedTicker.exchange,
            resolvedTicker.status,
            dividendRate
          ]
        );
        console.log(`[💾] Upserted (Public Company): ${company.companyName}`);
      }
      // Insert ETFs/Trusts into btc_etf table
      for (const etf of etfs) {
        const entityType = 'ETF/Trust';
        const resolvedTicker = await resolveTickerInfo(etf.companyName);
        let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(etf.companyName);
        }
        const normalizedName = normalizeCompanyName(etf.companyName);
        await connection.execute(
          'INSERT INTO btc_etf (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'ticker = VALUES(ticker), ' +
          'exchange = VALUES(exchange), ' +
          'ticker_status = VALUES(ticker_status), ' +
          'dividend_rate = VALUES(dividend_rate), ' +
          'last_updated = NOW()',
          [
            etf.companyName,
            normalizedName,
            etf.country,
            etf.btcHoldings,
            etf.usdValue,
            etf.entityUrl,
            entityType,
            resolvedTicker.ticker,
            resolvedTicker.exchange,
            resolvedTicker.status,
            dividendRate
          ]
        );
        console.log(`[💾] Upserted (ETF/Trust to btc_etf): ${etf.companyName}`);
      }
      await removeDuplicateTreasuries(connection);
      await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[❌] Transaction failed:', err.message);
      throw err;
    }

    // Upsert country breakdown into countries table
    console.log('[🔄] Upserting scraped country breakdown into countries table');
    for (const row of countryBreakdown) {
      await executeQuery(
        'INSERT INTO countries (country_name, total_btc, total_usd_m) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE total_btc = VALUES(total_btc), total_usd_m = VALUES(total_usd_m)',
        [row.country, row.total_btc, row.total_usd_m]
      );
      console.log(`[💾] Upserted (Country Breakdown): ${row.country}`);
    }

    return res.status(200).json({
      message: `Manual scrape completed with ${companies.length} public companies and ${etfs.length} ETFs/Trusts`
    });
  } catch (err) {
    console.error('[❌] Manual scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual scrape failed' });
  }
};

// POST /api/bitcoin-treasuries/manual-scrape-companies
export const runManualCompanyScrape = async (req, res) => {
  console.log('[🛠️] Manual company scrape triggered at', new Date().toISOString());
  try {
    const publicCompanies = await scrapeCompanyTreasuriesFromSite();
    console.log(`[ℹ️] Scraped ${publicCompanies.length} public companies from site`);

    let companies = publicCompanies.filter(isValidCompany);
    companies = dedupeCompanies(companies);
    console.log(`[✅] Validated and deduped to ${companies.length} public companies`);

    const connection = db;
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
      for (const company of companies) {
        const entityType = 'Public Company';
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(company.companyName);
        }
        const normalizedName = normalizeCompanyName(company.companyName);
        await connection.execute(
          'INSERT INTO bitcoin_treasuries (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), country = VALUES(country), btc_holdings = VALUES(btc_holdings), usd_value = VALUES(usd_value), entity_url = VALUES(entity_url), entity_type = VALUES(entity_type), ticker = VALUES(ticker), exchange = VALUES(exchange), ticker_status = VALUES(ticker_status), dividend_rate = VALUES(dividend_rate), last_updated = NOW()',
          [company.companyName, normalizedName, company.country, company.btcHoldings, company.usdValue, company.entityUrl, entityType, resolvedTicker.ticker, resolvedTicker.exchange, resolvedTicker.status, dividendRate]
        );
        console.log(`[💾] Upserted (Public Company): ${company.companyName}`);
      }
      await removeDuplicateTreasuries(connection);
      await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[❌] Transaction failed:', err.message);
      throw err;
    }

    return res.status(200).json({ message: `Manual company scrape completed with ${companies.length} public companies` });
  } catch (err) {
    console.error('[❌] Manual company scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual company scrape failed' });
  }
};

// POST /api/bitcoin-treasuries/manual-scrape-countries
export const runManualCountryScrape = async (req, res) => {
  console.log('[🛠️] Manual country breakdown scrape triggered at', new Date().toISOString());
  try {
    // Log before calling scrapeAllBreakdownFromSite
    console.log('[🔎] Calling scrapeAllBreakdownFromSite...');
    const countryBreakdown = await scrapeAllBreakdownFromSite(true);
    // Log after scraping
    console.log('[📋] Scraped raw country breakdown input:', countryBreakdown);
    console.log('[📋] Full scraped country breakdown response:', JSON.stringify(countryBreakdown, null, 2));
    console.log(`[ℹ️] Scraped ${countryBreakdown.length} country breakdown rows from site`);

    // Log the unfiltered breakdown before filtering
    console.log('[🪵] Unfiltered country breakdown before filtering:', JSON.stringify(countryBreakdown, null, 2));

    // Upsert country breakdown into btc_holders_by_type table
    const connection = db;
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
      for (const rawRow of countryBreakdown) {
        // Map row array to expected structure
        const [label, , , , btcRaw, , , usdRaw] = rawRow || [];
        const row = {
          label: label ? label.trim() : null,
          btc: btcRaw,
          usd_value: usdRaw
        };

        // Ensure btcRaw is consistently parsed even if formatted as a string with commas, symbols, etc.
        const totalBTC = parseFloat(row.btc?.toString().replace(/[^0-9.-]/g, '')) || 0;
        const totalUSDm = parseFloat(row.usd_value?.toString().replace(/[^0-9.-]/g, '')) / 1_000_000 || 0;

        const holderName = row.label || 'Unknown';
        const holderType = 'organization';

        await connection.execute(
          `INSERT INTO btc_holders_by_type (holder_name, holder_type, total_btc, total_usd_m)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             total_btc = VALUES(total_btc),
             total_usd_m = VALUES(total_usd_m),
             last_updated = CURRENT_TIMESTAMP`,
          [holderName, holderType, totalBTC, totalUSDm]
        );
        console.log(`[📥] Inserted/Updated BTC Holder: ${holderName}`);
      }
      await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[❌] Transaction failed (country breakdown):', err.message);
      throw err;
    }

    return res.status(200).json({ message: `Manual country breakdown scrape completed with ${countryBreakdown.length} rows` });
  } catch (err) {
    console.error('[❌] Manual country breakdown scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual country breakdown scrape failed' });
  }
};

// POST /api/bitcoin-treasuries/manual-scrape-etfs
export const runManualEtfScrape = async (req, res) => {
  console.log('[🛠️] Manual ETF holdings scrape triggered at', new Date().toISOString());
  try {
    const etfsAndTrusts = await scrapeEtfHoldingsFromSite();
    console.log(`[ℹ️] Scraped ${etfsAndTrusts.length} ETFs/Trusts from site`);

    let etfs = etfsAndTrusts.filter(isValidCompany);
    etfs = dedupeCompanies(etfs);
    console.log(`[✅] Validated and deduped to ${etfs.length} ETFs/Trusts`);

    const connection = db;
    try {
      await connection.beginTransaction();
      await connection.execute('SELECT GET_LOCK("bitcoin_treasuries_update", 10)');
      for (const etf of etfs) {
        const entityType = 'ETF/Trust';
        const resolvedTicker = await resolveTickerInfo(etf.companyName);
        let dividendRate = resolvedTicker.ticker ? await resolveDividendRateYahoo(resolvedTicker.ticker) : null;
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(etf.companyName);
        }
        const normalizedName = normalizeCompanyName(etf.companyName);
        await connection.execute(
          'INSERT INTO btc_etf (company_name, normalized_company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), country = VALUES(country), btc_holdings = VALUES(btc_holdings), usd_value = VALUES(usd_value), entity_url = VALUES(entity_url), entity_type = VALUES(entity_type), ticker = VALUES(ticker), exchange = VALUES(exchange), ticker_status = VALUES(ticker_status), dividend_rate = VALUES(dividend_rate), last_updated = NOW()',
          [etf.companyName, normalizedName, etf.country, etf.btcHoldings, etf.usdValue, etf.entityUrl, entityType, resolvedTicker.ticker, resolvedTicker.exchange, resolvedTicker.status, dividendRate]
        );
        console.log(`[💾] Upserted (ETF/Trust): ${etf.companyName}`);
      }
      await connection.execute('SELECT RELEASE_LOCK("bitcoin_treasuries_update")');
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[❌] Transaction failed (ETF scrape):', err.message);
      throw err;
    }

    return res.status(200).json({ message: `Manual ETF holdings scrape completed with ${etfs.length} ETFs/Trusts` });
  } catch (err) {
    console.error('[❌] Manual ETF holdings scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual ETF holdings scrape failed' });
  }
};
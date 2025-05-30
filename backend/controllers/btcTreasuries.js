import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';
import stringSimilarity from 'string-similarity';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
puppeteer.use(StealthPlugin());

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
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  console.log('[🕵️] Using User-Agent:', randomUserAgent);
  await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(() => {
      const table = document.querySelector('table');
      return table && table.querySelectorAll('tr').length >= 1;
    }, { timeout: 90000 });
    console.log('[✅] Table detected with at least one row');
  } catch (err) {
    console.error('[❌] Table not found after 90s. Retrying once...');
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    try {
      await page.waitForFunction(() => {
        const table = document.querySelector('table');
        return table && table.querySelectorAll('tr').length >= 1;
      }, { timeout: 60000 });
      console.log('[✅] Table found after reload');
    } catch (err2) {
      console.error('[❌] Retry failed:', err2.message);
      await browser.close();
      throw new Error(`Failed to load table after retry: ${err2.message}`);
    }
  }
  // Extract only public companies
  let companies = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return null;
      // Usually the first column is entity type, second is name, third is country
      // If entity type includes "Public Company", it's a public company
      const entityType = cells[0].innerText.trim();
      if (!/public company/i.test(entityType)) return null;
      return {
        entityType,
        companyName: cells[1].innerText.trim(),
        country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
        btcHoldings: cells[3].innerText.trim(),
        usdValue: cells[4].innerText.trim(),
        entityUrl: cells[5]?.querySelector('a')?.href || ''
      };
    }).filter(Boolean);
  });
  await browser.close();
  return companies;
}

// Scrape country BTC and USD breakdown from https://bitcointreasuries.net/
export async function scrapeCountryBreakdownFromSite() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(() => {
      const table = document.querySelector('table');
      return table && table.querySelectorAll('tr').length >= 1;
    }, { timeout: 90000 });
  } catch (err) {
    await browser.close();
    throw new Error('Failed to load table for country breakdown');
  }
  // Parse all rows, aggregate by country
  let countryMap = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
    const map = {};
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      const country = cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, '');
      let btc = parseFloat(cells[3].innerText.replace(/,/g, '').replace(/[^\d.-]/g, '')) || 0;
      let usd = parseFloat(cells[4].innerText.replace(/[^0-9.]/g, '')) || 0;
      if (!country) return;
      if (!map[country]) map[country] = { total_btc: 0, total_usd: 0 };
      map[country].total_btc += btc;
      map[country].total_usd += usd;
    });
    // Convert to array and USD to millions
    return Object.entries(map).map(([country, { total_btc, total_usd }]) => ({
      country,
      total_btc,
      total_usd_m: total_usd / 1_000_000
    }));
  });
  await browser.close();
  return countryMap;
}

// Scrape ETF/Trust holdings from https://bitcointreasuries.net/
export async function scrapeEtfHoldingsFromSite() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(() => {
      const table = document.querySelector('table');
      return table && table.querySelectorAll('tr').length >= 1;
    }, { timeout: 90000 });
  } catch (err) {
    await browser.close();
    throw new Error('Failed to load table for ETF/Trust scraping');
  }
  // Extract only ETF/Trust rows (not public companies)
  let etfs = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
    return rows.map(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return null;
      const entityType = cells[0].innerText.trim();
      if (/public company/i.test(entityType)) return null;
      return {
        entityType,
        companyName: cells[1].innerText.trim(),
        country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
        btcHoldings: cells[3].innerText.trim(),
        usdValue: cells[4].innerText.trim(),
        entityUrl: cells[5]?.querySelector('a')?.href || ''
      };
    }).filter(Boolean);
  });
  await browser.close();
  return etfs;
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
        'SELECT company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, dividend_rate ' +
        'FROM bitcoin_treasuries WHERE last_updated > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      console.log(`[📊] Found ${cachedRows.length} cached rows`);
    } catch (err) {
      console.error('[❌] Failed to query cached Bitcoin treasury companies:', err.message);
    }

    if (cachedRows.length > 0) {
      const cachedCompanies = cachedRows.map(row => ({
        entityType: row.company_name,
        companyName: row.company_name,
        country: row.country,
        btcHoldings: row.btc_holdings,
        usdValue: row.usd_value,
        entityUrl: row.entity_url || '',
        ticker: row.ticker || '',
        exchange: row.exchange || '',
        dividendRateDollars: row.dividend_rate ?? null
      }));
      // Sort cached data by btcHoldings descending
      const sortedCachedCompanies = cachedCompanies.sort((a, b) => parseBTC(b.btcHoldings) - parseBTC(a.btcHoldings));
      console.log(`[📬] Returning ${sortedCachedCompanies.length} sorted cached companies`);
      return res.json(sortedCachedCompanies);
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

// GET /api/bitcoin-treasuries/countries
export const getTreasuryCountriesHandler = async (req, res) => {
  console.log('[⚙️] getTreasuryCountriesHandler called at', new Date().toISOString());
  try {
    const rows = await executeQuery(`
      SELECT country_name AS country, total_btc, total_usd_m
      FROM countries
      WHERE country_name IS NOT NULL
      ORDER BY total_btc DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to fetch treasury countries:', err.message);
    return res.status(500).json({ error: 'Failed to load countries' });
  }
};

// GET /api/bitcoin-treasuries/country-breakdown
export const getTreasuryCountryBreakdown = async (req, res) => {
  console.log('[📈] getTreasuryCountryBreakdown called at', new Date().toISOString());
  try {
    const rows = await executeQuery(`
      SELECT country, 
             SUM(CAST(REPLACE(REPLACE(btc_holdings, ',', ''), ' BTC', '') AS DECIMAL(20,4))) AS total_btc,
             SUM(CAST(REPLACE(REPLACE(usd_value, ',', ''), '$', '') AS DECIMAL(20,4))) / 1000000 AS total_usd_m
      FROM bitcoin_treasuries
      WHERE country IS NOT NULL AND country != ''
      GROUP BY country
      ORDER BY total_usd_m DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to compute country BTC/USD breakdown:', err.message);
    return res.status(500).json({ error: 'Country BTC/USD breakdown failed' });
  }
};

// GET /api/bitcoin-treasuries/etfs
export const getBitcoinTreasuryEtfsHandler = async (req, res) => {
  console.log('[⚙️] getBitcoinTreasuryEtfsHandler called at', new Date().toISOString());
  try {
    const rows = await executeQuery(
      `SELECT company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, dividend_rate
       FROM btc_etf
       WHERE last_updated > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    const etfs = rows.map(row => ({
      entityType: 'ETF/Trust',
      companyName: row.company_name,
      country: row.country,
      btcHoldings: row.btc_holdings,
      usdValue: row.usd_value,
      entityUrl: row.entity_url || '',
      ticker: row.ticker || '',
      exchange: row.exchange || '',
      dividendRateDollars: row.dividend_rate ?? null
    }));

    console.log(`[📊] Returning ${etfs.length} BTC ETF entries from btc_etf table`);
    return res.json(etfs);
  } catch (err) {
    console.error('[❌] getBitcoinTreasuryEtfsHandler error:', err.message, err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin ETF data' });
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
// Export handler for compatibility with named import in routes
export { getBitcoinTreasuryEtfsHandler as getBitcoinTreasuryEtfs };
export { getTreasuryCountriesHandler as getTreasuryCountries };
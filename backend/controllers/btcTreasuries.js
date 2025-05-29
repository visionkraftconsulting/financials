import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

puppeteer.use(StealthPlugin());

// --- DB column migration: Ensure dividend_rate column exists ---
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
  } else {
    console.log('[ℹ️] dividend_rate column already exists');
  }
} catch (err) {
  console.error('[❌] Failed to check/add dividend_rate column:', err.message);
}

// List of user agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Helper function to resolve ticker info for a company
async function resolveTickerInfo(companyName) {
  try {
    // Placeholder logic: Query Yahoo Finance or another reliable source
    // For example, use Yahoo Finance search API or scrape a page to get ticker and exchange
    // Here we simulate a lookup with a dummy response for demonstration purposes

    // Example: Use Yahoo Finance autocomplete API
    const response = await axios.get('https://query2.finance.yahoo.com/v1/finance/search', {
      params: { q: companyName, quotesCount: 1, newsCount: 0 }
    });

    if (response.data && response.data.quotes && response.data.quotes.length > 0) {
      const quote = response.data.quotes[0];
      const ticker = quote.symbol || '';
      const exchange = quote.exchange || '';
      const ticker_status = ticker ? 'valid' : 'not_found';
      return { ticker, exchange, status: ticker_status };
    } else {
      return { ticker: '', exchange: '', status: 'not_found' };
    }
  } catch (err) {
    console.error(`[❌] Error resolving ticker for ${companyName}:`, err.message);
    return { ticker: '', exchange: '', status: 'invalid' };
  }
}

// Helper: Fetch dividend rate via Yahoo Finance summaryDetail
async function resolveDividendRateYahoo(ticker) {
  try {
    const resp = await axios.get(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${ticker}`,
      { params: { modules: 'summaryDetail' } }
    );
    const summary = resp.data.quoteSummary?.result?.[0]?.summaryDetail;
    const rate = summary?.dividendRate?.raw
      || summary?.trailingAnnualDividendRate?.raw
      || summary?.forwardAnnualDividendRate?.raw;
    return rate != null ? rate.toString() : null;
  } catch (err) {
    console.error(`[❌] Yahoo Finance dividend fetch failed for ${ticker}:`, err.message);
    return null;
  }
}

// Helper: Fallback to OpenAI to determine dividend rate if Yahoo fails
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

// New: Get Bitcoin treasury companies (updated to filter for public companies)
export const getBitcoinTreasuries = async (req, res) => {
  console.log('[⚙️] getBitcoinTreasuries called at', new Date().toISOString());
  console.log('[🕵️‍♂️] Request IP:', req.ip);
  try {
    console.log('[🧭] Entering Bitcoin Treasuries scraping logic');
    console.log('[📊] Checking cached Bitcoin treasury companies');

    // Check for cached data
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

    // Return all cached companies
    const cachedCompanies = cachedRows.map(row => ({
      entityType: row.company_name,
      companyName: row.company_name,
      country: row.country,
      btcHoldings: row.btc_holdings,
      usdValue: row.usd_value,
      entityUrl: row.entity_url || '',
      ticker: row.ticker || '',
      exchange: row.exchange || ''
      , dividendRateDollars: row.dividend_rate ?? null
    }));

    if (cachedCompanies.length > 0) {
      console.log(`[📬] Returning ${cachedCompanies.length} cached companies`);
      return res.json(cachedCompanies);
    }

    console.log('[📅] Cache is outdated or empty, proceeding to scrape');

    // Clear outdated cache entries
    try {
      await executeQuery(
        'DELETE FROM bitcoin_treasuries WHERE last_updated <= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      console.log('[🧹] Cleared outdated cache entries');
    } catch (err) {
      console.error('[❌] Failed to clear outdated cache entries:', err.message);
    }

    console.log('[🌐] Launching Puppeteer');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set a random user agent
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    console.log('[🕵️] Using User-Agent:', randomUserAgent);

    // Navigate to Bitcoin Treasuries
    console.log('[🌐] Navigating to https://bitcointreasuries.net/');
    await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('[🌐] Waiting for table to render...');
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

    // Extract data using page.evaluate
    const companies = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1); // Skip header
      const entityTypes = new Set();
      const parsedCompanies = rows.map((row, idx) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;
        const entityType = cells[0].innerText.trim();
        entityTypes.add(entityType);
        return {
          companyName: cells[0].innerText.trim(),
          country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
          btcHoldings: cells[3].innerText.trim(),
          usdValue: cells[4].innerText.trim(),
          entityUrl: cells[5]?.querySelector('a')?.href || '',
          entityType
        };
      }).filter(Boolean);
      console.log('[🧾] Unique entityTypes detected:', Array.from(entityTypes));
      return parsedCompanies;
    });

    console.log('[🧾] All scraped entityTypes:', companies.map(c => c.entityType));

    // 🔍 Enhance data with OpenAI for potential missing companies
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

      for (const company of additionalCompanies) {
        if (!companies.find(c => c.companyName.toLowerCase() === company.companyName.toLowerCase())) {
          companies.push(company);
          console.log(`[💡] Added from OpenAI: ${company.companyName}`);
        }
      }
    } catch (err) {
      console.error('[❌] Failed OpenAI enhancement:', err.message);
    }
    await browser.close();
    console.log('[🔍] Parsed company rows:', companies.length);

    // Filter for public companies only
    const publicCompanies = companies.filter(company => company.entityType === 'Public Company');
    console.log(`[📬] Found ${publicCompanies.length} public companies holding Bitcoin`);

    // Cache all companies (not just public ones) to avoid redundant scraping
    for (const company of companies) {
      try {
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, ticker_status) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'ticker = VALUES(ticker), ' +
          'exchange = VALUES(exchange), ' +
          'ticker_status = VALUES(ticker_status), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            resolvedTicker.ticker,
            resolvedTicker.exchange,
            resolvedTicker.status
          ]
        );
        console.log(`[💾] Cached/Updated: ${company.companyName}`);
      } catch (err) {
        console.error(`[❌] Failed to cache ${company.companyName}:`, err.message);
      }
    }

    console.log('[🚚] Sending response with public companies data');
    // Remove duplicates by verifying with OpenAI; fall back to exact dedupe on failure
    const parseBTC = (val) => parseFloat(val.replace(/[^\d.-]/g, '').replace(',', '')) || 0;
    const isValidBTC = (val) => !val.includes('%');
    let uniqueNames = [];
    try {
      const namesList = publicCompanies.map(c => c.companyName).join(', ');
      const prompt = `From the following list of public company names holding Bitcoin, remove duplicates and list each unique company only once.`;
      const dedupeMessages = [
        { role: 'system', content: 'You are a JSON formatter. Respond with only a JSON array of unique company names and no additional text.' },
        { role: 'user', content: `${prompt}\n\n${namesList}` }
      ];
      const dedupeRes = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: dedupeMessages,
        temperature: 0
      });
      uniqueNames = JSON.parse(dedupeRes.choices[0].message.content.trim());
    } catch (err) {
      console.error('[❌] OpenAI duplicate verification failed, falling back to exact dedupe:', err.message);
      uniqueNames = publicCompanies.map(c => c.companyName)
        .filter((n, i, arr) => arr.indexOf(n) === i);
    }

    const filteredSortedCompanies = uniqueNames
      .map(name => publicCompanies.find(c => c.companyName === name))
      .filter(c => c && isValidBTC(c.btcHoldings))
      .sort((a, b) => parseBTC(b.btcHoldings) - parseBTC(a.btcHoldings));

    console.log(`[📊] Returning ${filteredSortedCompanies.length} unique and BTC-sorted public companies (excluding invalid entries)`);
    return res.json(filteredSortedCompanies);
  } catch (err) {
    console.error('[❌] Bitcoin treasuries fetch error:', err.message);
    console.error('[🐛] Full error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin treasury data' });
  }
};

// GET /api/bitcoin-treasuries/countries
export const getTreasuryCountries = async (req, res) => {
  console.log('[⚙️] getTreasuryCountries called at', new Date().toISOString());
  try {
    const rows = await executeQuery(`
      SELECT country_name AS country, total_btc, total_usd_m
      FROM countries
      WHERE country_name IS NOT NULL
      ORDER BY total_usd_m DESC
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
      .filter(Boolean);

    console.log(`[🧠] Parsed ${parsedCompanies.length} companies from OpenAI response`);

    // Insert or update these into the DB
    for (const company of parsedCompanies) {
      try {
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        await executeQuery(
          'INSERT IGNORE INTO countries (country_name) VALUES (?)',
          [company.country]
        );
        let dividendRate = null;
        if (resolvedTicker.ticker) {
          dividendRate = await resolveDividendRateYahoo(resolvedTicker.ticker);
        }
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(company.companyName);
        }
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, entity_type, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
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
            company.entityType,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            company.entityType,
            resolvedTicker.ticker,
            resolvedTicker.exchange,
            resolvedTicker.status,
            dividendRate
          ]
        );
        console.log(`[💾] OpenAI entry cached/updated: ${company.companyName}`);
      } catch (err) {
        console.error(`[❌] Failed to update OpenAI company ${company.companyName}:`, err.message);
      }
    }

    // Update countries table with aggregate BTC/USD totals for Countries tab
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

    return res.status(200).json({ message: `OpenAI update completed with ${parsedCompanies.length} entries` });
  } catch (err) {
    console.error('[❌] Failed OpenAI update:', err.message);
    return res.status(500).json({ error: 'OpenAI update failed' });
  }
};

// POST /api/bitcoin-treasuries/manual-scrape
export const runManualScrape = async (req, res) => {
  console.log('[🛠️] Manual scrape triggered at', new Date().toISOString());
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(() => {
      const table = document.querySelector('table');
      return table && table.querySelectorAll('tr').length >= 1;
    }, { timeout: 90000 });

    const companies = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;
        return {
          entityType: cells[0].innerText.trim(),
          companyName: cells[1].innerText.trim(),
          country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
          btcHoldings: cells[3].innerText.trim(),
          usdValue: cells[4].innerText.trim(),
          entityUrl: cells[5]?.querySelector('a')?.href || ''
        };
      }).filter(Boolean);
    });

    await browser.close();

    console.log('[🧠] Running OpenAI dedupe on scraped companies');
    let uniqueNames;
    try {
      const namesList = companies.map(c => c.companyName).join(', ');
      const prompt = `Here is a list of public-company names that report Bitcoin holdings. ` +
        `Please remove duplicate or variant entries (e.g. “Gov't of X” vs “X Government”) ` +
        `and return a JSON array of the unique company names only:\n\n${namesList}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0
      });
      uniqueNames = JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error('[❌] OpenAI dedupe failed — falling back to exact unique:', err.message);
      uniqueNames = companies.map(c => c.companyName)
                            .filter((n, i, arr) => arr.indexOf(n) === i);
    }

    const dedupedCompanies = uniqueNames
      .map(name => companies.find(c => c.companyName === name))
      .filter(Boolean);

    companies.length = 0;
    companies.push(...dedupedCompanies);
    console.log(`[✅] Deduped to ${companies.length} companies before DB upsert`);

    for (const company of companies) {
      try {
        const resolvedTicker = await resolveTickerInfo(company.companyName);
        // Ensure the country exists or is updated with BTC/USD totals
        const parsedBtc = parseFloat(company.btcHoldings.replace(/[^\d.-]/g, '').replace(',', '')) || 0;
        const parsedUsd = parseFloat(company.usdValue.replace(/[^\d.-]/g, '').replace(',', '')) || 0;
        await executeQuery(
          'INSERT INTO countries (country_name, total_btc, total_usd_m) VALUES (?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE total_btc = total_btc + VALUES(total_btc), total_usd_m = total_usd_m + VALUES(total_usd_m)',
          [company.country, parsedBtc, parsedUsd / 1_000_000]
        );
        // Determine dividend rate: try Yahoo Finance first, then fallback to OpenAI
        let dividendRate = null;
        if (resolvedTicker.ticker) {
          dividendRate = await resolveDividendRateYahoo(resolvedTicker.ticker);
        }
        if (dividendRate == null) {
          dividendRate = await resolveDividendRateAI(company.companyName);
        }
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, ticker_status, dividend_rate) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
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
            company.entityType,
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
        console.log(`[💾] Scraped and updated: ${company.companyName}`);
      } catch (err) {
        console.error(`[❌] Failed to update ${company.companyName}:`, err.message);
      }
    }

    // Remove any duplicate rows by company_name, keeping the earliest entry
    console.log('[🧹] Removing duplicate treasury entries by company_name');
    await executeQuery(
      'DELETE t1 FROM bitcoin_treasuries t1 ' +
      'INNER JOIN bitcoin_treasuries t2 ON t1.company_name = t2.company_name AND t1.id > t2.id'
    );

    // Update countries table with aggregate BTC/USD totals for Countries tab
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

    return res.status(200).json({ message: `Manual scrape completed with ${companies.length} entries` });
  } catch (err) {
    console.error('[❌] Manual scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual scrape failed' });
  }
};

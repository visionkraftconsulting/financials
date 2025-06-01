import fs from 'fs/promises';
import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import yahooFinance from 'yahoo-finance2';
import cron from 'node-cron';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
];

// Scrape ETF/Trust holdings from https://bitcointreasuries.net/
export async function scrapeEtfHoldingsFromSite() {
  console.log('[🌐] Launching browser for ETF scraping...');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);
    console.log('[🕵️‍♂️] Using user-agent:', randomUserAgent);
    console.log('[🌐] Navigating to https://bitcointreasuries.net/...');

    await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForFunction(
      () => {
        const table = document.querySelector('table');
        return table && table.querySelectorAll('tr').length >= 1;
      },
      { timeout: 90000 }
    );
    console.log('[✅] Table loaded, starting ETF extraction...');

    console.log('[🔍] Processing ETF rows from page...');
    const etfs = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;

        const entityType = cells[0].innerText.trim();
        if (!/(ETF|Trust)/i.test(entityType)) return null;
        if (/government|custody solution/i.test(entityType)) return null;

        return {
          entityType,
          companyName: cells[0].innerText.trim(),
          ticker: cells[1].innerText.trim(),
          country: cells[2].innerText.trim(),
          btcHoldings: (() => {
            const raw = cells[3].innerText.trim();
            const numeric = parseFloat(raw.replace(/[,$MB]/gi, '').trim());
            return isNaN(numeric) ? null : `${numeric.toFixed(2)} ₿`;
          })(),
          usdValue: (() => {
            const raw = cells[4].innerText.trim();
            const numeric = parseFloat(raw.replace(/[^0-9.]/g, ''));
            let parsed = null;
            if (!isNaN(numeric)) {
              if (/B/i.test(raw)) parsed = (numeric * 1_000_000_000).toFixed(2);
              else if (/M/i.test(raw)) parsed = (numeric * 1_000_000).toFixed(2);
              else parsed = numeric.toFixed(2);
            }
            return {
              raw,
              parsed,
            };
          })(),
          entityUrl: cells[5]?.querySelector('a')?.href || '',
        };
      }).filter(Boolean);
    });

    // Deduplicate ETFs by ticker before insertion
    const seenTickers = new Set();
    const uniqueEtfs = etfs.filter(etf => {
      if (seenTickers.has(etf.ticker)) {
        console.log(`[⚠️] Skipping duplicate ticker: ${etf.ticker} (${etf.companyName})`);
        return false;
      }
      seenTickers.add(etf.ticker);
      return true;
    });

    // Insert or update ETF entries
    for (let etf of uniqueEtfs) {
      const companyName = etf.companyName;
      if (!etf.btcHoldings) {
        console.log(`[⏩] Skipped ETF due to missing BTC holdings: ${companyName}`);
        continue;
      }

      const btcAmount = parseFloat(etf.btcHoldings.replace(/[^\d.-]/g, ''));
      if (btcAmount <= 0) {
        console.log(`[⏩] Skipped ETF due to zero BTC holdings: ${companyName}`);
        continue;
      }

      try {
        // Normalize company name by removing emojis and extra spaces
        const normalizedName = companyName
          .replace(/[\p{Emoji}]/gu, '') // Remove emojis
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/gi, '');

        // Check if ticker or normalized_company_name exists
        const existing = await executeQuery(
          `SELECT id FROM btc_etf WHERE ticker = ? OR normalized_company_name = ?`,
          [etf.ticker, normalizedName]
        );

        if (existing.length > 0) {
          // Update existing entry
          await executeQuery(
            `UPDATE btc_etf 
             SET btc_holdings = ?, entity_url = ?, last_updated = NOW(), company_name = ?, country = ?, entity_type = ?
             WHERE id = ?`,
            [etf.btcHoldings, etf.entityUrl, companyName, etf.country || 'Unknown', etf.entityType, existing[0].id]
          );
          console.log(`[🔄] Updated BTC holdings for ${companyName} (ID: ${existing[0].id}, Ticker: ${etf.ticker})`);
        } else {
          // Insert new ETF entry
          const insertQuery = `
            INSERT INTO btc_etf (
              company_name, normalized_company_name, country, btc_holdings,
              usd_value, usd_share_percent, entity_url, entity_type, ticker,
              exchange, ticker_status, dividend_rate, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          await executeQuery(insertQuery, [
            companyName,
            normalizedName,
            etf.country || 'Unknown', // Default to 'Unknown' if country is empty
            etf.btcHoldings,
            etf.usdValue.parsed ?? null, // Use parsed USD value directly
            null, // usd_share_percent unknown
            etf.entityUrl,
            etf.entityType,
            etf.ticker,
            null, // exchange unknown
            null, // ticker_status unknown
            null, // dividend_rate unknown
          ]);
          console.log(`[➕] Inserted new ETF with BTC holdings: ${companyName} (Ticker: ${etf.ticker})`);
        }
      } catch (dbErr) {
        console.error(`[❌] Failed to update DB for ${companyName} (Ticker: ${etf.ticker}):`, dbErr.message);
      }
    }

    // Update BTC price and USD values
    await updateBtcPriceInDb();
    const [{ price_usd: currentBtcPrice }] = await executeQuery(
      `SELECT price_usd FROM btc_price WHERE id = 1`
    );

    const rowsToUpdate = await executeQuery(`SELECT id, btc_holdings FROM btc_etf`);
    for (const row of rowsToUpdate) {
      const btcAmount = parseFloat(row.btc_holdings.replace(/[^\d.-]/g, ''));
      if (isNaN(btcAmount)) {
        console.log(`[⚠️] Skipping USD update for ID ${row.id} due to invalid BTC holdings: ${row.btc_holdings}`);
        continue;
      }
      const usdValue = (btcAmount * currentBtcPrice).toFixed(2);
      await executeQuery(`UPDATE btc_etf SET usd_value = ? WHERE id = ?`, [usdValue, row.id]);
    }

    // After successful insert or update, update dividend rates
    await updateAllDividendRates();

    console.log('[🔎] Preview of scraped ETF data (first 3 entries):', uniqueEtfs.slice(0, 3));
    console.log('[📊] Full structured ETF data returned from scraping:');
    uniqueEtfs.forEach((etf, index) => {
      console.log(`[${index + 1}] ${etf.companyName} (Ticker: ${etf.ticker})`);
      console.log(`    [BTC] ${etf.btcHoldings}`);
      console.log(`    [USD] raw: ${etf.usdValue.raw}, parsed: ${etf.usdValue.parsed}`);
    });
    console.log(`[📥] Extracted ${uniqueEtfs.length} ETF/Trust entries`);
    await fs.writeFile('debug-etfs.json', JSON.stringify(uniqueEtfs, null, 2));
    console.log('[📝] ETF data saved to debug-etfs.json');
    return uniqueEtfs;
  } catch (err) {
    console.error('[❌] ETF scraping failed:', err.message);
    throw new Error('Failed to scrape ETF/Trust holdings');
  } finally {
    if (browser) {
      await browser.close();
      console.log('[🌐] Browser closed');
    }
  }
}

export const getBitcoinTreasuryEtfs = async (req, res) => {
  console.log('[⚙️] getBitcoinTreasuryEtfs called at', new Date().toISOString());
  try {
    const rows = await executeQuery(
      `SELECT company_name, country, btc_holdings, usd_value, entity_url, ticker, exchange, dividend_rate
       FROM btc_etf
       WHERE last_updated > DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    // Deduplicate by ticker
    const seen = new Set();
    const etfs = rows
      .filter(row => parseFloat(row.usd_value) > 0)
      .filter(row => {
        if (!row.ticker) {
          console.log(`[⚠️] Skipping row with missing ticker: ${row.company_name}`);
          return false;
        }
        if (seen.has(row.ticker)) {
          console.log(`[⚠️] Skipping duplicate ticker in query: ${row.ticker} (${row.company_name})`);
          return false;
        }
        seen.add(row.ticker);
        return true;
      })
      .map(row => ({
        entityType: 'ETF/Trust',
        companyName: row.company_name,
        country: row.country,
        btcHoldings: row.btc_holdings,
        usdValue: row.usd_value ? `$${parseFloat(row.usd_value).toFixed(2)}` : null,
        entityUrl: row.entity_url || '',
        ticker: row.ticker,
        exchange: row.exchange || '',
        dividendRateDollars: row.dividend_rate ?? null,
      }));

    console.log(`[📊] Returning ${etfs.length} BTC ETF entries from btc_etf table`);
    return res.json(etfs);
  } catch (err) {
    console.error('[❌] getBitcoinTreasuryEtfs error:', err.message, err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin ETF data' });
  }
};

// Fetch and update BTC price into btc_price table using on-chain data via CoinGecko
export async function updateBtcPriceInDb() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
      },
    });

    const btcPrice = response.data?.bitcoin?.usd;
    if (!btcPrice || isNaN(btcPrice)) {
      throw new Error('Invalid BTC price from CoinGecko');
    }

    await executeQuery(
      `INSERT INTO btc_price (id, price_usd, updated_at)
       VALUES (1, ?, NOW())
       ON DUPLICATE KEY UPDATE price_usd = VALUES(price_usd), updated_at = VALUES(updated_at)`,
      [btcPrice]
    );

    console.log(`[📈] BTC Price updated in DB using CoinGecko: $${btcPrice}`);
  } catch (err) {
    if (err.response) {
      console.error('[❌] Failed to update BTC price in DB (CoinGecko):', err.response.status, err.response.data);
    } else {
      console.error('[❌] Failed to update BTC price in DB (CoinGecko):', err.message);
    }
  }
}
// Schedule BTC price update every minute
setInterval(() => {
  updateBtcPriceInDb();
}, 60 * 1000);

// Alpha Vantage API for dividend data
const ALPHA_VANTAGE_API_KEY = '7LQR9VFJHX8V1Z4C';

async function fetchDividendRateFromAlphaVantage(ticker) {
  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await axios.get(url);
    const dividend = response.data.DividendPerShare;
    if (!dividend || isNaN(parseFloat(dividend))) {
      return 'No Dividend';
    }
    return parseFloat(dividend).toFixed(2);
  } catch (error) {
    console.error(`[❌] Alpha Vantage API error for ${ticker}: ${error.message}`);
    return 'No Dividend';
  }
}

// New function to fetch and update dividend rate for a given ticker using Alpha Vantage
async function fetchAndUpdateDividendRate(ticker, db) {
  try {
    const dividendRate = await fetchDividendRateFromAlphaVantage(ticker);
    await db.query('UPDATE btc_etf SET dividend_rate = ? WHERE ticker = ?', [dividendRate, ticker]);
    console.log(`[✅] Updated dividend for ${ticker}: ${dividendRate}`);
  } catch (err) {
    console.error(`[❌] Failed to fetch dividend for ${ticker}:`, err.message);
    await db.query('UPDATE btc_etf SET dividend_rate = ? WHERE ticker = ?', ['No Dividend', ticker]);
  }
}

// Wrapper function to update all dividend rates
export async function updateAllDividendRates() {
  console.log('[📥] Starting dividend rate update from Polygon API...');
  try {
    const tickers = await executeQuery('SELECT ticker FROM btc_etf WHERE ticker IS NOT NULL');
    for (const { ticker } of tickers) {
      if (!ticker || typeof ticker !== 'string' || !ticker.trim()) continue;

      let retries = 0;
      let success = false;
      while (retries < 3 && !success) {
        try {
          await fetchAndUpdateDividendRate(ticker.trim(), { query: executeQuery });
          success = true;
        } catch (err) {
          retries++;
          console.warn(`[⏳] Retry ${retries} for ${ticker}: ${err.message}`);
          await delay(1500); // Wait 1.5s before retry
        }
      }

      // Final fallback
      if (!success) {
        console.error(`[❌] Giving up on dividend for ${ticker} after 3 attempts`);
        await executeQuery('UPDATE btc_etf SET dividend_rate = ? WHERE ticker = ?', ['No Dividend', ticker]);
      }

      await delay(1000); // Throttle each request
    }
  } catch (err) {
    console.error('[❌] Failed to update all dividend rates:', err.message);
  }
}

// Schedule dividend rate update monthly on the 1st day at midnight
cron.schedule('0 0 1 * *', () => {
  console.log('[📅] Monthly dividend update triggered.');
  updateAllDividendRates();
});

// Manual trigger for dividend rate update
export const runManualDividendRateScrape = async (req, res) => {
  console.log('[🛠️] Manual dividend rate update triggered at', new Date().toISOString());
  try {
    await updateAllDividendRates();
    return res.status(200).json({ message: 'Manual dividend rate update completed' });
  } catch (err) {
    console.error('[❌] Manual dividend rate update failed:', err.message);
    return res.status(500).json({ error: 'Manual dividend rate update failed' });
  }
};

// Manual trigger for BTC price update
export const runManualBtcPriceScrape = async (req, res) => {
  console.log('[🛠️] Manual BTC price update triggered at', new Date().toISOString());
  try {
    await updateBtcPriceInDb();
    return res.status(200).json({ message: 'Manual BTC price update completed' });
  } catch (err) {
    console.error('[❌] Manual BTC price update failed:', err.message);
    return res.status(500).json({ error: 'Manual BTC price update failed' });
  }
};
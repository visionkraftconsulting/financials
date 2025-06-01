import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Scrape ETF/Trust holdings from https://bitcointreasuries.net/
export async function scrapeEtfHoldingsFromSite() {
  console.log('[🌐] Launching browser for ETF scraping...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  console.log('[🕵️‍♂️] Using user-agent:', randomUserAgent);
  console.log('[🌐] Navigating to https://bitcointreasuries.net/...');
  await page.goto('https://bitcointreasuries.net/', { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(() => {
      const table = document.querySelector('table');
      return table && table.querySelectorAll('tr').length >= 1;
    }, { timeout: 90000 });
    console.log('[✅] Table loaded, starting ETF extraction...');
  } catch (err) {
    console.error('[❌] Failed to find ETF table within timeout');
    await browser.close();
    throw new Error('Failed to load table for ETF/Trust scraping');
  }
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
        country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
        btcHoldings: (() => {
          const raw = cells[3].innerText.trim();
          const numeric = parseFloat(raw.replace(/[,$MB]/g, '').trim());
          return numeric ? numeric.toFixed(6) : null;
        })(),
        usdValue: (() => {
          const raw = cells[4].innerText.trim();
          const num = parseFloat(raw.replace(/[$,]/g, ''));
          if (isNaN(num)) return null;
          if (raw.includes('B')) return (num * 1_000_000_000).toFixed(2);
          if (raw.includes('M')) return (num * 1_000_000).toFixed(2);
          return num.toFixed(2);
        })(),
        entityUrl: cells[5]?.querySelector('a')?.href || ''
      };
    }).filter(Boolean);
  });
  console.log('[🔎] Preview of scraped ETF data (first 3 entries):', etfs.slice(0, 3));
  console.log('[📊] Full structured ETF data returned from scraping:');
  etfs.forEach((etf, index) => {
    console.log(`[${index + 1}]`, JSON.stringify(etf, null, 2));
  });
  console.log(`[📥] Extracted ${etfs.length} ETF/Trust entries`);
  await browser.close();
  return etfs;
}

export const getBitcoinTreasuryEtfs = async (req, res) => {
  console.log('[⚙️] getBitcoinTreasuryEtfs called at', new Date().toISOString());
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
    console.error('[❌] getBitcoinTreasuryEtfs error:', err.message, err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin ETF data' });
  }
};
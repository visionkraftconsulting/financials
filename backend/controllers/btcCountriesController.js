import { populateCountriesFromHolders } from '../services/countryService.js';
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
    throw new Error('Failed to load table for breakdown');
  }

  const fullTableData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr'));
    return rows.slice(1).map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => {
        const span = cell.querySelector('span') || cell;
        return span.innerText?.trim() || null;
      });
    });
  });

  console.log('[📋] Scraped full breakdown table data:', fullTableData);
  await browser.close();
  return fullTableData;
}

// POST /api/bitcoin-treasuries/manual-populate-countries-from-holders
export const runPopulateCountriesFromHolders = async (req, res) => {
  console.log('[🛠️] Manual populate countries from holders triggered at', new Date().toISOString());
  try {
    await populateCountriesFromHolders();
    return res.status(200).json({ message: 'Populate countries from holders completed' });
  } catch (error) {
    console.error('[❌] Populate countries from holders failed:', error.message);
    return res.status(500).json({ error: 'Populate countries from holders failed' });
  }
};

export const getTreasuryCountries = async (req, res) => {
  console.log('[⚙️] getTreasuryCountries called at', new Date().toISOString());
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

export const handlePopulateBtcHoldersByType = async () => {
  const url = 'https://bitcointreasuries.net/';
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  try {
    await page.waitForSelector('table', { timeout: 90000 });
  } catch (err) {
    await browser.close();
    throw new Error('Failed to load table for holders by type');
  }

  const holdersData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr'));
    return rows.slice(1).map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => cell.innerText.trim());
    });
  });

  for (const rowData of holdersData) {
    const holderName = rowData[0] || null;
    const totalBTC = parseFloat((rowData[1] || '').replace(/[₿,]/g, '').trim()) || 0;

    if (!holderName) continue;

    await executeQuery(`
      INSERT INTO btc_holders_by_type (holder_type, total_btc)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE total_btc = VALUES(total_btc)
    `, [holderName, totalBTC]);
  }

  await browser.close();
};
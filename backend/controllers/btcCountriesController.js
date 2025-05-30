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
    throw new Error('Failed to load table for country breakdown');
  }
  const countryMap = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr')).slice(1);
    const map = {};
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;
      const country = cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, '');
      let btc = parseFloat(cells[3].innerText.replace(/,/g, '').replace(/[^0-9.-]/g, '')) || 0;
      let usd = parseFloat(cells[4].innerText.replace(/[^0-9.]/g, '')) || 0;
      if (!country) return;
      if (!map[country]) map[country] = { total_btc: 0, total_usd: 0 };
      map[country].total_btc += btc;
      map[country].total_usd += usd;
    });
    return Object.entries(map).map(([country, { total_btc, total_usd }]) => ({
      country,
      total_btc,
      total_usd_m: total_usd / 1_000_000
    }));
  });
  await browser.close();
  return countryMap;
}

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
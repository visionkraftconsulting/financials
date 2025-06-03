import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logsDir = `${__dirname}/logs`;
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logStream = fs.createWriteStream(`${logsDir}/etf_update_log.txt`, { flags: 'a' });

console.log('🚀 Starting ETF update script...');

import dotenv from 'dotenv';
import path from 'path';
import { getAccessToken, refreshTokenIfNeeded } from './tokenService.js';
import { login } from '../services/authService.js';
dotenv.config({ path: path.resolve('/home/bitnami/scripts/financial/investment-tracker/backend/.env') });

import mysql from 'mysql2/promise';

function logError(ticker, msg, err) {
  const log = `[${new Date().toISOString()}] [${ticker}] ${msg}: ${err?.message || err}\n`;
  fs.appendFileSync('./logs/finnhub-errors.log', log);
  console.error(log);
}

async function getRecentEtfs(connection) {
  const [rows] = await connection.execute(`
    SELECT ticker, fund_name
    FROM high_yield_etfs
  `);
  return rows;
}

async function updateDividendDetails(connection, ticker, details) {
  const [rows] = await connection.execute(
    `SELECT dividend_rate, distribution_frequency FROM high_yield_etfs WHERE ticker = ?`,
    [ticker]
  );

  const current = rows[0] || {};
  console.log(`🔎 ${ticker} current values — dividend_rate: ${current.dividend_rate}, distribution_frequency: ${current.distribution_frequency}`);
  console.log(`🆕 ${ticker} new values — dividend_rate: ${details.dividend_rate}, distribution_frequency: ${details.distribution_frequency}`);
  logStream.write(`🔎 ${ticker} current values — dividend_rate: ${current.dividend_rate}, distribution_frequency: ${current.distribution_frequency}\n`);
  logStream.write(`🆕 ${ticker} new values — dividend_rate: ${details.dividend_rate}, distribution_frequency: ${details.distribution_frequency}\n`);

  await connection.execute(
    `UPDATE high_yield_etfs SET dividend_rate = ?, distribution_frequency = ?, verified_by_ai = 1 WHERE ticker = ?`,
    [details.dividend_rate, details.distribution_frequency, ticker]
  );
  console.log(`✅ Updated ${ticker}`);
  logStream.write(`✅ Updated ${ticker}\n`);
}

async function updateETFRecord(ticker, updated) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.execute(
      `SELECT dividend_rate FROM high_yield_etfs WHERE ticker = ?`,
      [ticker]
    );
    const currentRate = rows[0]?.dividend_rate || 0;

    if (updated.dividend_rate !== currentRate) {
      await connection.execute(
        `UPDATE high_yield_etfs SET dividend_rate = ?, verified_by_ai = 1 WHERE ticker = ?`,
        [updated.dividend_rate, ticker]
      );
      console.log(`✅ Updated ${ticker} with dividend_rate ${updated.dividend_rate}`);
      logStream.write(`✅ Updated ${ticker} with dividend_rate ${updated.dividend_rate}\n`);
    } else {
      console.log(`ℹ️ No update needed for ${ticker}`);
      logStream.write(`ℹ️ No update needed for ${ticker}\n`);
    }
  } catch (err) {
    logError(ticker, 'DB update error', err);
  } finally {
    await connection.end();
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('📡 Connecting to DB...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ DB connection established.');
    const etfs = await getRecentEtfs(connection);
    console.log(`📊 Found ${etfs.length} ETFs fetched in the last hour.`);
    await connection.end();
    console.log('🔌 Closed DB connection.');

    try {
      await login(); // Ensures fresh tokens are acquired once for all ETF processing
    } catch (authErr) {
      console.error('❌ Login/authentication failed:', authErr);
      process.exit(1);
    }

    for (const etf of etfs) {
      const ticker = etf.ticker;
      console.log(`\n========== Processing ${ticker} ==========\n`);
      try {
        await sleep(1100);

        // await login(); // Removed login call inside loop

        console.log(`[${new Date().toISOString()}] [${ticker}] Fetching dividend data...`);
        let accessToken = await getAccessToken();
        const headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        };

        let dividendsRes = await fetch(
          `https://api.schwab.com/v1/marketdata/etf/${ticker}/dividends`,
          { headers }
        );
        if (dividendsRes.status === 401) {
          console.log(`[${ticker}] Access token expired, refreshing token...`);
          accessToken = await refreshTokenIfNeeded();
          headers.Authorization = `Bearer ${accessToken}`;
          dividendsRes = await fetch(
            `https://api.schwab.com/v1/marketdata/etf/${ticker}/dividends`,
            { headers }
          );
        }
        if (!dividendsRes.ok) throw new Error(`Dividend fetch failed (${dividendsRes.status})`);
        const dividends = await dividendsRes.json();
        const dividendSum = dividends.reduce((acc, div) => acc + parseFloat(div.amount || 0), 0);

        console.log(`[${new Date().toISOString()}] [${ticker}] Fetched dividends:`, dividends);
        console.log(`[${new Date().toISOString()}] [${ticker}] Calculated dividend sum: ${dividendSum}`);

        console.log(`[${new Date().toISOString()}] [${ticker}] Fetching quote data...`);
        let quoteRes = await fetch(
          `https://api.schwab.com/v1/marketdata/etf/${ticker}/quote`,
          { headers }
        );
        if (quoteRes.status === 401) {
          console.log(`[${ticker}] Access token expired, refreshing token...`);
          accessToken = await refreshTokenIfNeeded();
          headers.Authorization = `Bearer ${accessToken}`;
          quoteRes = await fetch(
            `https://api.schwab.com/v1/marketdata/etf/${ticker}/quote`,
            { headers }
          );
        }
        if (!quoteRes.ok) throw new Error(`Quote fetch failed (${quoteRes.status})`);
        const quoteData = await quoteRes.json();
        console.log(`[${new Date().toISOString()}] [${ticker}] Quote fetched:`, quoteData);

        const quote = quoteData?.lastPrice;

        const updated = {
          dividend_rate: parseFloat(dividendSum.toFixed(2)),
          current_price: quote,
          distribution_frequency: 'quarterly'
        };

        await updateETFRecord(ticker, updated);
      } catch (err) {
        const status = err?.status || err?.response?.statusCode || err?.response?.status || 'unknown';
        logError(ticker, `ETF update error (HTTP ${status})`, err);
        console.error(`[${ticker}] Full error:`, err);
        if (err?.response?.headers) {
          console.error(`[${ticker}] Error headers:`, err.response.headers);
        }
      }
    }
  } catch (e) {
    console.error('❌ Fatal error during script execution:', e);
  } finally {
    if (connection) await connection.end();
    logStream.end();
    console.log('📄 Script execution finished.');
  }
})();

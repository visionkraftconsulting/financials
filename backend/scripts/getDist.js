#!/usr/bin/env node

import dotenv from 'dotenv';
import { watch } from 'fs';
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });
import yahooFinance from 'yahoo-finance2';
import { argv } from 'node:process';
import mysql from 'mysql2/promise';

// CLI params
const symbolArg = argv.find(arg => arg.startsWith('--symbol='));
const symbol = symbolArg ? symbolArg.split('=')[1] : 'MSTY';
const updateDb = argv.includes('--update-db');
const updateAll = argv.includes('--all');

// DB credentials from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

async function getDividends(ticker) {
  try {
    const result = await yahooFinance.chart(ticker, { period1: '2000-01-01', events: 'dividends' });
    const dividends = result.events?.dividends || [];
    const dividendArray = Object.entries(dividends).map(([timestamp, data]) => ({
      date: new Date(Number(timestamp) * 1000),
      dividends: data.amount
    }));

    const sorted = dividendArray.sort((a, b) => b.date - a.date);

    let frequency = 'Unknown';
    if (dividendArray.length >= 2) {
      const intervals = dividendArray
        .map(d => d.date)
        .sort((a, b) => a - b)
        .map((date, i, arr) => i > 0 ? (date - arr[i - 1]) / (1000 * 60 * 60 * 24) : null)
        .filter(v => v !== null);

      const avgDays = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgDays < 45) frequency = 'Monthly';
      else if (avgDays < 100) frequency = 'Quarterly';
      else if (avgDays < 200) frequency = 'Semi-Annual';
      else frequency = 'Annual';
    }

    console.log(`Latest dividends for ${ticker}:`);
    console.log(sorted.slice(0, 5)); // show latest 5
    console.log(`Estimated Frequency: ${frequency}`);

    if (updateDb && sorted[0]) {
      const latest = sorted[0];
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'UPDATE high_yield_etfs SET dividend_rate = ?, latest_dividend_date = ?, distribution_frequency = ? WHERE ticker = ?',
        [latest.dividends, latest.date.toISOString().slice(0, 10), frequency, ticker]
      );
      console.log(`Database updated for ${ticker}: ${rows.affectedRows} row(s).`);
      await connection.end();
    }

  } catch (err) {
    console.error(`Error fetching dividends for ${ticker}:`, err.message);
  }
}

async function runJob() {
  if (updateAll) {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT ticker FROM high_yield_etfs');
    for (const row of rows) {
      await getDividends(row.ticker);
    }
    await connection.end();
  } else {
    await getDividends(symbol);
  }
}

async function main() {
  console.log("[getDist] Script started at", new Date().toISOString());
  if (updateAll || symbolArg) {
    await runJob(); // manual run
  } else {
    await runJob(); // first run
    setInterval(runJob, 1000 * 60 * 60 * 12); // repeat every 12 hours
  }
  if (process.env.NODE_ENV !== 'production') {
    watch('.', { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(`[getDist] Detected change in ${filename}. Restarting...`);
        process.exit(0);
      }
    });
  }
}
main();
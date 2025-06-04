import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import yahooFinance from 'yahoo-finance2';
import fs from 'fs';
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { format as formatDate } from 'date-fns';

// Setup __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env config
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });

// Logger setup
const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.printf(({ timestamp, level, message }) => `${timestamp} - ${level.toUpperCase()} - ${message}`)),
  transports: [new transports.Console()],
});

// MySQL config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Fetch ETF data
async function fetchETFData() {
  try {
    console.log('Connecting to MySQL for fetchETFData...');
    const conn = await mysql.createConnection(dbConfig);
    console.log('Connected. Executing SELECT query...');
    const [rows] = await conn.execute('SELECT ticker, distribution_frequency, dividend_rate FROM high_yield_etfs');
    await conn.end();
    logger.info('Loaded ETF data from database.');
    return rows;
  } catch (err) {
    logger.error(`Failed to load ETF data: ${err.message}`);
    console.error(err);
    return [];
  }
}

// Scrape dividend data from Twelve Data API
async function scrapeYahooFinance(ticker) {
  try {
    logger.info(`Fetching dividend data for ${ticker} from Twelve Data API`);
    const endDate = formatDate(new Date(), 'yyyy-MM-dd');
    const startDate = formatDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'); // ~6 months back

    const divRes = await axios.get('https://api.twelvedata.com/dividends', {
      params: {
        symbol: ticker,
        apikey: process.env.TWELVE_DATA_API_KEY,
        start_date: startDate,
        end_date: endDate,
      },
    });

    const dividendData = divRes.data.dividends || [];
    dividendData.sort((a, b) => new Date(b.pay_date) - new Date(a.pay_date));
    const lastDividend = dividendData.length > 0 ? parseFloat(dividendData[0].amount) : null;

    // Estimate frequency based on number of dividends
    let frequency = 'unknown';
    if (dividendData.length >= 12) frequency = 'monthly';
    else if (dividendData.length >= 4) frequency = 'quarterly';
    else if (dividendData.length >= 2) frequency = 'semi-annual';
    else if (dividendData.length >= 1) frequency = 'annual';

    return [lastDividend, frequency];
  } catch (err) {
    logger.error(`Error fetching from Twelve Data API for ${ticker}: ${err.message}`);
    return [null, 'unknown'];
  }
}

// Update DB
async function updateDatabase(data) {
  let conn;
  try {
    console.log('Connecting to MySQL for updateDatabase...');
    conn = await mysql.createConnection(dbConfig);
    for (const row of data) {
      const ticker = row.ticker || null;
      const dividendRate = isNaN(row.dividend_rate) ? null : parseFloat(row.dividend_rate);
      const frequency = row.distribution_frequency === 'unknown' ? null : row.distribution_frequency;

      console.log(`Checking existence of ${ticker}...`);
      const [existsRows] = await conn.execute('SELECT COUNT(*) as count FROM high_yield_etfs WHERE ticker = ?', [ticker]);
      const exists = existsRows[0].count > 0;

      console.log(`Executing SQL: ${exists ? 'UPDATE' : 'INSERT'} for ${ticker}`);
      if (exists) {
        await conn.execute('UPDATE high_yield_etfs SET dividend_rate = ?, distribution_frequency = ?, dividend_rate_dollars = NULL WHERE ticker = ?', [dividendRate, frequency, ticker]);
        logger.info(`Updated ${ticker} with dividend ${dividendRate}, frequency ${frequency}`);
      } else {
        await conn.execute('INSERT INTO high_yield_etfs (ticker, dividend_rate, distribution_frequency) VALUES (?, ?, ?)', [ticker, dividendRate, frequency]);
        logger.info(`Inserted ${ticker} with dividend ${dividendRate}, frequency ${frequency}`);
      }
    }
    await conn.end();
    logger.info('Database updated successfully');
  } catch (err) {
    logger.error(`Database error: ${err.message}`);
    console.error(err);
    if (conn) await conn.end();
  }
}

// Main
(async () => {
  const df = await fetchETFData();

  for (const row of df) {
    if (!row.dividend_rate || row.distribution_frequency === 'unknown') {
      const [dividend, frequency] = await scrapeYahooFinance(row.ticker);
      if (dividend !== null) row.dividend_rate = dividend;
      if (frequency !== 'unknown') row.distribution_frequency = frequency;
    }
  }

  // Write CSV
  const csvPath = path.join(__dirname, 'etf_dividend_data.csv');
  const csvData = [
    'ticker,dividend_rate,distribution_frequency',
    ...df.map(r => `${r.ticker},${r.dividend_rate ?? ''},${r.distribution_frequency ?? ''}`)
  ].join('\n');

  try {
    fs.writeFileSync(csvPath, csvData, 'utf-8');
    logger.info('Data saved to etf_dividend_data.csv');
  } catch (err) {
    logger.error(`Failed to save CSV backup: ${err.message}`);
  }

  // Update DB
  await updateDatabase(df);
})();
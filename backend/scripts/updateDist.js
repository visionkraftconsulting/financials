import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });

// MySQL config
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Fetch tickers from DB and use ScraperAPI to retrieve distribution frequency
async function updateDistributionFrequency() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT ticker FROM high_yield_etfs');
    console.log(`Fetched ${rows.length} tickers.`);

    for (const { ticker } of rows) {
      const query = `${ticker} distribution frequency`;
      const url = 'https://api.scraperapi.com/structured/google/search';
      const params = {
        api_key: process.env.SCRAPERAPI_KEY,
        query: query,
      };

      try {
        const response = await axios.get(url, { params });
        console.log('---------------------------------------------------');
        console.log(`ScraperAPI response for ${ticker}:`, JSON.stringify(response.data, null, 2));
        console.log('---------------------------------------------------');
        try {
          const dataToLog = JSON.stringify(response.data, null, 2);
          console.log(`${ticker}: ${dataToLog}`);
        } catch (e) {
          console.warn(`${ticker}: Failed to stringify response data: ${e.message}`);
        }
        if (response.data.featured_snippet?.text) {
          console.log(`${ticker} frequency info: ${response.data.featured_snippet.text}`);
          // Normalize frequency (enhanced logic)
          const rawText = response.data.featured_snippet.text.toLowerCase();
          let frequency = 'Other';
          if (/\b(weekly|every week|once a week|per week)\b/.test(rawText)) {
            frequency = 'Weekly';
          } else if (/\b(biweekly|every other week|twice a month|2 times a month)\b/.test(rawText)) {
            frequency = 'Biweekly';
          } else if (/\b(monthly|every month|once a month|per month)\b/.test(rawText)) {
            frequency = 'Monthly';
          } else if (/\b(bimonthly|every 2 months|once every two months)\b/.test(rawText)) {
            frequency = 'Bimonthly';
          } else if (/\b(quarterly|every 3 months|four times a year|per quarter)\b/.test(rawText)) {
            frequency = 'Quarterly';
          } else if (/\b(semiannually|semi-annual|every 6 months|twice a year)\b/.test(rawText)) {
            frequency = 'Semiannually';
          } else if (/\b(annually|annual|yearly|every 12 months|once a year|per year)\b/.test(rawText)) {
            frequency = 'Annually';
          }
          try {
            await conn.execute('UPDATE high_yield_etfs SET distribution_frequency = ? WHERE ticker = ?', [frequency, ticker]);
            console.log(`${ticker}: frequency updated in DB as "${frequency}".`);
          } catch (dbErr) {
            console.error(`${ticker}: Failed to update DB with frequency: ${dbErr.message}`);
          }
        } else {
          console.log(`${ticker} frequency info not found in featured snippet.`);
        }
        if (response.data && response.data.results) {
          console.log(`${ticker} structured results:`);
          response.data.results.forEach((res, idx) => {
            console.log(`Result ${idx + 1}:`, res.title || res.link || JSON.stringify(res));
          });
        }
      } catch (err) {
        console.error(`Failed to fetch from ScraperAPI for ${ticker}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`DB error: ${err.message}`);
  } finally {
    if (conn) await conn.end();
  }
}

// Run script
updateDistributionFrequency();
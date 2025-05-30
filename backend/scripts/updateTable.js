import dotenv from 'dotenv';
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });
import mysql from 'mysql2/promise';
import OpenAI from 'openai';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fuzzy } from 'fast-fuzzy';
import winston from 'winston';

puppeteer.use(StealthPlugin());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'updateTable.log' }),
    new winston.transports.Console()
  ]
});

// Fetch companies from database
async function fetchCompanies(connection) {
  const [rows] = await connection.execute(`
    SELECT id, company_name, btc_holdings, country 
    FROM bitcoin_treasuries
    WHERE last_verified IS NULL OR last_verified < NOW() - INTERVAL 7 DAY
  `);
  return rows;
}

// Scrape Bitcoin holdings and country from bitcointreasuries.net
async function scrapeCompanyData(companyName) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://bitcointreasuries.net', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for the table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Extract table data
    const companies = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          name: cells[0]?.textContent.trim(),
          btc: cells[2]?.textContent.trim().replace(/[^\d.]/g, ''),
          country: cells[4]?.textContent.trim()
        };
      }).filter(c => c.name && c.btc && c.country);
    });

    // Fuzzy match company name
    const bestMatch = companies.reduce((best, curr) => {
      const score = fuzzy(companyName, curr.name);
      return score > best.score ? { ...curr, score } : best;
    }, { name: '', btc: '', country: '', score: 0 });

    if (bestMatch.score > 0.85) {
      logger.info(`Matched "${companyName}" to "${bestMatch.name}" (Score: ${bestMatch.score})`);
      return {
        btcHoldings: bestMatch.btc,
        country: bestMatch.country
      };
    } else {
      logger.warn(`No reliable match for "${companyName}" (Best: "${bestMatch.name}", Score: ${bestMatch.score})`);
      return null;
    }
  } catch (err) {
    logger.error(`Scrape error for "${companyName}": ${err.message}`);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

// Verify with OpenAI as fallback
async function verifyCompanyWithOpenAI(companyName) {
  const prompt = `
    Confirm the Bitcoin holdings (as of the most recent data available in 2025) and country of the company: "${companyName}".
    Respond strictly in JSON format:
    {"btcHoldings": "<number_or_Unknown>", "country": "<country_or_Unknown>"}
    e.g., {"btcHoldings": "580250", "country": "United States"}
    If unverified, use: {"btcHoldings": "Unknown", "country": "Unknown"}
    Ensure data is sourced from reliable financial reports or company announcements.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0
    });

    const result = JSON.parse(completion.choices[0].message.content);
    logger.info(`OpenAI result for "${companyName}": ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    logger.error(`OpenAI error for "${companyName}": ${err.message}`);
    return null;
  }
}

// Retry logic for network calls
async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error(`Failed after ${maxAttempts} attempts: ${err.message}`);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Update company in database
async function updateCompany(connection, id, newBTC, newCountry) {
  await connection.execute(
    `UPDATE bitcoin_treasuries SET btc_holdings = ?, country = ?, last_updated = NOW(), last_verified = NOW() WHERE id = ?`,
    [newBTC, newCountry, id]
  );
  logger.info(`Updated company ID ${id} → BTC: ${newBTC}, Country: ${newCountry}`);
}

// Log update history
async function logUpdate(connection, companyId, oldBTC, newBTC, oldCountry, newCountry) {
  await connection.execute(
    `INSERT INTO update_history (company_id, old_btc, new_btc, old_country, new_country, updated_at) VALUES (?, ?, ?, ?, ?, NOW())`,
    [companyId, oldBTC, newBTC, oldCountry, newCountry]
  );
}

// Verify company holdings with both sources
async function verifyCompanyHoldings(company) {
  const scrapeResult = await withRetry(() => scrapeCompanyData(company.company_name));
  const openaiResult = await withRetry(() => verifyCompanyWithOpenAI(company.company_name));

  if (scrapeResult && scrapeResult.btcHoldings !== 'Unknown' && scrapeResult.country !== 'Unknown') {
    // Prioritize scraped data if valid
    logger.info(`Using scraped data for "${company.company_name}": BTC=${scrapeResult.btcHoldings}, Country=${scrapeResult.country}`);
    return scrapeResult;
  } else if (openaiResult && openaiResult.btcHoldings !== 'Unknown' && openaiResult.country !== 'Unknown') {
    // Fallback to OpenAI if scrape fails
    logger.warn(`Falling back to OpenAI for "${company.company_name}": BTC=${openaiResult.btcHoldings}, Country=${openaiResult.country}`);
    return openaiResult;
  } else {
    logger.warn(`No reliable data for "${company.company_name}". Scrape: ${JSON.stringify(scrapeResult)}, OpenAI: ${JSON.stringify(openaiResult)}`);
    return null;
  }
}

// Process companies in batches
async function processInBatches(connection, companies, batchSize = 10) {
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    await Promise.all(batch.map(async company => {
      try {
        const result = await verifyCompanyHoldings(company);
        if (!result) return;

        const currentBTC = parseFloat(company.btc_holdings.replace(/[^\d.]/g, ''));
        const newBTC = parseFloat(result.btcHoldings);
        const shouldUpdate =
          result.btcHoldings !== 'Unknown' &&
          result.country !== 'Unknown' &&
          (Math.abs(newBTC - currentBTC) / (currentBTC || 1) > 0.01 || // Flag >1% change
           result.country.toLowerCase() !== company.country.toLowerCase());

        if (shouldUpdate) {
          // Log large changes for manual review
          if (Math.abs(newBTC - currentBTC) / (currentBTC || 1) > 0.1) {
            logger.warn(`Large change detected for "${company.company_name}": ${currentBTC} → ${newBTC}`);
          }
          await updateCompany(connection, company.id, `₿ ${result.btcHoldings}`, result.country);
          await logUpdate(connection, company.id, company.btc_holdings, `₿ ${result.btcHoldings}`, company.country, result.country);
        } else {
          logger.info(`No update needed for "${company.company_name}"`);
        }
      } catch (err) {
        logger.error(`Error processing "${company.company_name}": ${err.message}`);
      }
    }));
  }
}

// Main execution
(async () => {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const companies = await fetchCompanies(connection);
    logger.info(`Processing ${companies.length} companies`);
    await processInBatches(connection, companies, 10);
  } catch (err) {
    logger.error(`Script failed: ${err.message}`);
  } finally {
    await connection.end();
    logger.info('Database connection closed');
  }
})();
import { executeQuery } from '../utils/db.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

puppeteer.use(StealthPlugin());

// List of user agents for rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
];

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
        'SELECT company_name, country, btc_holdings, usd_value, entity_url, entity_type ' +
        'FROM bitcoin_treasuries WHERE last_updated > DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      console.log(`[📊] Found ${cachedRows.length} cached rows`);
    } catch (err) {
      console.error('[❌] Failed to query cached Bitcoin treasury companies:', err.message);
    }

    // Return all cached companies
    const cachedCompanies = cachedRows.map(row => ({
      entityType: row.entity_type,
      companyName: row.company_name,
      country: row.country,
      btcHoldings: row.btc_holdings,
      usdValue: row.usd_value,
      entityUrl: row.entity_url || ''
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
          entityType,
          companyName: cells[1].innerText.trim(),
          country: cells[2].innerText.trim().replace(/[^A-Za-z\s]/g, ''),
          btcHoldings: cells[3].innerText.trim(),
          usdValue: cells[4].innerText.trim(),
          entityUrl: cells[5]?.querySelector('a')?.href || ''
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

      const completion = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: openaiPrompt }],
        temperature: 0.2
      });

      const additionalCompaniesText = completion.data.choices[0].message.content;
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
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, entity_type) ' +
          'VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            company.entityType
          ]
        );
        console.log(`[💾] Cached/Updated: ${company.companyName} (${company.entityType})`);
      } catch (err) {
        console.error(`[❌] Failed to cache ${company.companyName}:`, err.message);
      }
    }

    console.log('[🚚] Sending response with public companies data');
    // Deduplicate public companies by companyName
    const uniqueCompaniesMap = new Map();
    for (const company of publicCompanies) {
      if (!uniqueCompaniesMap.has(company.companyName)) {
        uniqueCompaniesMap.set(company.companyName, company);
      }
    }

    const parseBTC = (val) => parseFloat(val.replace(/[^\d.-]/g, '').replace(',', '')) || 0;
    const isValidBTC = (val) => !val.includes('%');

    const filteredSortedCompanies = Array.from(uniqueCompaniesMap.values())
      .filter(company => isValidBTC(company.btcHoldings))
      .sort((a, b) => parseBTC(b.btcHoldings) - parseBTC(a.btcHoldings)); // Descending order

    console.log(`[📊] Returning ${filteredSortedCompanies.length} unique and BTC-sorted public companies (excluding invalid entries)`);
    return res.json(filteredSortedCompanies);
  } catch (err) {
    console.error('[❌] Bitcoin treasuries fetch error:', err.message);
    console.error('[🐛] Full error stack:', err.stack);
    return res.status(500).json({ error: 'Failed to fetch Bitcoin treasury data' });
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
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, entity_type, last_updated) ' +
          'VALUES (?, ?, ?, ?, ?, ?, NOW()) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            company.entityType
          ]
        );
        console.log(`[💾] OpenAI entry cached/updated: ${company.companyName}`);
      } catch (err) {
        console.error(`[❌] Failed to update OpenAI company ${company.companyName}:`, err.message);
      }
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

    for (const company of companies) {
      try {
        await executeQuery(
          'INSERT INTO bitcoin_treasuries (company_name, country, btc_holdings, usd_value, entity_url, entity_type) ' +
          'VALUES (?, ?, ?, ?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE ' +
          'company_name = VALUES(company_name), ' +
          'country = VALUES(country), ' +
          'btc_holdings = VALUES(btc_holdings), ' +
          'usd_value = VALUES(usd_value), ' +
          'entity_url = VALUES(entity_url), ' +
          'entity_type = VALUES(entity_type), ' +
          'last_updated = NOW()',
          [
            company.companyName,
            company.country,
            company.btcHoldings,
            company.usdValue,
            company.entityUrl,
            company.entityType
          ]
        );
        console.log(`[💾] Scraped and updated: ${company.companyName}`);
      } catch (err) {
        console.error(`[❌] Failed to update ${company.companyName}:`, err.message);
      }
    }

    return res.status(200).json({ message: `Manual scrape completed with ${companies.length} entries` });
  } catch (err) {
    console.error('[❌] Manual scrape failed:', err.message);
    return res.status(500).json({ error: 'Manual scrape failed' });
  }
};
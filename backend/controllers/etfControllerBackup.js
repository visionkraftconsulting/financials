const FMP_API_KEY = process.env.FMP_API_KEY || 'KbZqIumPoV2pkLZk2V4XUmXRef5czO5Q';
import { execSync } from 'child_process';
import { executeQuery } from '../utils/db.js';
import yahooFinance from 'yahoo-finance2';
import OpenAI from 'openai';
import cron from 'node-cron';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseISO } from 'date-fns';
// Returns tickers in high_yield_etfs missing yield or not verified, fetched in last day
const getIncompleteTickers = async () => {
  try {
    const rows = await executeQuery(`
      SELECT ticker FROM high_yield_etfs
      WHERE (yield_percent IS NULL OR verified_by_ai = 0)
      AND fetched_at >= NOW() - INTERVAL 1 DAY
    `);
    return rows.map(row => row.ticker);
  } catch (err) {
    console.warn('[⚠️] Failed to fetch incomplete tickers:', err.message);
    return [];
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let lastOpenAIFetch = null;
let dynamicTableYields = {};
let dynamicKnownFrequencies = {};
let dynamicDividendRates = {}; // Added declaration
let lastDynamicUpdate = null;

// [🧠] Helper: Verify/calculate dividend yield using OpenAI given price and dividendRate
const verifyDividendDataWithOpenAI = async (ticker, price, dividendRate) => {
  if (!price || !dividendRate) return null;

  try {
    const prompt = `An ETF has a market price of $${price} and an annual dividend rate of $${dividendRate}. What is the correct dividend yield percentage for this ETF? Respond with just the number (no % sign).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const content = response?.choices?.[0]?.message?.content?.trim();
    const parsedYield = content ? parseFloat(content.replace('%', '')) : null;

    if (!isNaN(parsedYield)) {
      console.log(`[🧠] Verified yield from OpenAI for ${ticker}: ${parsedYield}`);
      return parsedYield;
    } else {
      console.warn(`[⚠️] Invalid yield from OpenAI for ${ticker}:`, content);
      return null;
    }
  } catch (err) {
    console.error(`[❌] OpenAI yield check failed for ${ticker}:`, err.message);
    return null;
  }
};

// [🧠] Helper: Calculate dividend yield using OpenAI given price and dividendRate (no ticker)
export const getDividendYieldWithOpenAI = async (price, dividendRate) => {
  if (!price || !dividendRate) return null;
  try {
    const prompt = `An ETF has a market price of $${price} and an annual dividend rate of $${dividendRate}. What is the correct dividend yield percentage for this ETF? Respond with just the number (no % sign).`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });
    const content = response?.choices?.[0]?.message?.content?.trim();
    const parsed = content ? parseFloat(content.replace('%', '')) : null;
    return isNaN(parsed) ? null : parsed;
  } catch (err) {
    console.error(`[❌] OpenAI yield calculation failed:`, err.message);
    return null;
  }
};

const DYNAMIC_UPDATE_INTERVAL = 1000 * 60 * 60 * 12; // 12 hours
const MAX_YIELD = 500; // Cap yields at 500%

// Fallback data loader
const loadFallbackEtfData = async () => {
  const rows = await executeQuery(`
    SELECT ticker, distribution_frequency, yield_percent, dividend_rate
    FROM fallback_etf_data
  `);
  const frequencies = {};
  const yields = {};
  const dividendRates = {};
  for (const row of rows) {
    const ticker = row.ticker;
    frequencies[ticker] = row.distribution_frequency;
    yields[ticker] = parseFloat(row.yield_percent);
    dividendRates[ticker] = parseFloat(row.dividend_rate);
  }
  return { frequencies, yields, dividendRates };
};

export const shouldFetchFromOpenAI = () => {
  const now = new Date();
  return !lastOpenAIFetch || ((now - lastOpenAIFetch) > 1000 * 60 * 60 * 12);
};

export const markOpenAIFetch = () => {
  lastOpenAIFetch = new Date();
};

// Fetch dynamic yields, frequencies, and dividend rates from database
const updateDynamicData = async () => {
  const now = new Date();
  if (lastDynamicUpdate && (now - lastDynamicUpdate) < DYNAMIC_UPDATE_INTERVAL) {
    console.log('[📊] Skipping dynamic data update — within interval');
    return;
  }

  try {
    console.log('[📊] Updating dynamic tableYields, knownFrequencies, and dividendRates');
    const fallbackData = await loadFallbackEtfData();
    const rows = await executeQuery(`
      SELECT ticker, yield_percent, distribution_frequency, dividend_rate
      FROM high_yield_etfs
      WHERE fetched_at >= NOW() - INTERVAL 7 DAY
        AND yield_percent IS NOT NULL
        AND yield_percent > 0
        AND yield_percent <= ?
      ORDER BY fetched_at DESC
    `, [MAX_YIELD]);

    const yieldMap = {};
    const frequencyMap = {};
    const dividendRateMap = {};

    const tickerData = {};
    rows.forEach(row => {
      if (!tickerData[row.ticker]) {
        tickerData[row.ticker] = { yields: [], frequency: null, dividendRates: [] };
      }
      tickerData[row.ticker].yields.push(Math.min(row.yield_percent, MAX_YIELD));
      if (row.distribution_frequency && row.distribution_frequency !== 'Unknown') {
        tickerData[row.ticker].frequency = row.distribution_frequency;
      }
      if (row.dividend_rate && !isNaN(parseFloat(row.dividend_rate))) {
        tickerData[row.ticker].dividendRates.push(parseFloat(row.dividend_rate));
      }
    });

    for (const ticker in tickerData) {
      const yields = tickerData[ticker].yields;
      yieldMap[ticker] = yields.length
        ? (yields.reduce((sum, y) => sum + y, 0) / yields.length).toFixed(2)
        : fallbackData.yields[ticker] || null;
      frequencyMap[ticker] = tickerData[ticker].frequency || fallbackData.frequencies[ticker] || 'Unknown';
      const dividendRates = tickerData[ticker].dividendRates;
      dividendRateMap[ticker] = dividendRates.length
        ? (dividendRates.reduce((sum, d) => sum + d, 0) / dividendRates.length).toFixed(2)
        : fallbackData.dividendRates[ticker] || null;
    }

    dynamicTableYields = yieldMap;
    dynamicKnownFrequencies = frequencyMap;
    dynamicDividendRates = dividendRateMap;
    lastDynamicUpdate = now;

    console.log('[📊] Dynamic data updated:', {
      yields: Object.keys(dynamicTableYields).length,
      frequencies: Object.keys(dynamicKnownFrequencies).length,
      dividendRates: Object.keys(dynamicDividendRates).length,
    });
  } catch (err) {
    console.error('[❌] Failed to update dynamic data:', err.message);
  }
};

// Fetch yield, frequency, and dividend rate from external source
const fetchFromExternalSource = async (ticker) => {
  try {
    // Try yieldmaxetfs.com for YieldMax ETFs
    let url = `https://www.yieldmaxetfs.com/funds/${ticker.toLowerCase()}/`;
    let response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 5000,
    });
    let $ = cheerio.load(response.data);

    let yieldPercent = null;
    let distributionFrequency = null;
    let dividendRate = null;

    // YieldMax selectors (adjust after inspection)
    const yieldText = $('.etf-yield').text().trim();
    if (yieldText && yieldText.includes('%')) {
      yieldPercent = parseFloat(yieldText.replace('%', '')) || null;
    }

    const freqText = $('.etf-distribution').text().trim().toLowerCase();
    if (freqText.includes('monthly')) {
      distributionFrequency = 'Monthly';
    } else if (freqText.includes('weekly')) {
      distributionFrequency = 'Weekly';
    } else if (freqText.includes('quarterly')) {
      distributionFrequency = 'Quarterly';
    } else if (freqText.includes('annually')) {
      distributionFrequency = 'Annually';
    }

    const divText = $('.etf-dividend').text().trim();
    if (divText && divText.includes('$')) {
      dividendRate = parseFloat(divText.replace('$', '')) || null;
    }

    // Fallback to etfdb.com
    if (!yieldPercent || !distributionFrequency || !dividendRate) {
      url = `https://etfdb.com/etf/${ticker}/`;
      response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 5000,
      });
      $ = cheerio.load(response.data);

      if (!yieldPercent) {
        const etfYieldText = $('#dividend .value').text().trim();
        if (etfYieldText && etfYieldText.includes('%')) {
          yieldPercent = parseFloat(etfYieldText.replace('%', '')) || null;
        }
      }

      if (!distributionFrequency) {
        const etfFreqText = $('#dist-freq .value').text().trim();
        if (etfFreqText && ['Monthly', 'Weekly', 'Quarterly', 'Annually'].includes(etfFreqText)) {
          distributionFrequency = etfFreqText;
        }
      }

      if (!dividendRate) {
        const etfDivText = $('#dividend-amount .value').text().trim();
        if (etfDivText && etfDivText.includes('$')) {
          dividendRate = parseFloat(etfDivText.replace('$', '')) || null;
        }
      }
    }

    console.log(`[🌖] Fetched for ${ticker}: yield=${yieldPercent}, frequency=${distributionFrequency}, dividendRate=${dividendRate}`);
    return { yieldPercent, distributionFrequency, dividendRate };
  } catch (err) {
    console.warn(`[⚠️] Failed to fetch external data for ${ticker}:`, err.message);
    return { yieldPercent: null, distributionFrequency: null, dividendRate: null };
  }
};

const fetchFromFMP = async (ticker) => {
  try {
    const url = `https://site.financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const response = await axios.get(url);

    if (!response.data || !response.data.length) {
      throw new Error('Empty data from FMP');
    }

    const etf = response.data[0];
    const yieldPercent = etf.dividendYield ? parseFloat(etf.dividendYield) : null;
    const dividendRate = etf.lastDiv ? parseFloat(etf.lastDiv) : null;
    const distributionFrequency = etf.frequency || null;

    console.log(`[📥] FMP for ${ticker}: yield=${yieldPercent}, rate=${dividendRate}, freq=${distributionFrequency}`);
    return { yieldPercent, dividendRate, distributionFrequency };
  } catch (err) {
    console.warn(`[⚠️] Failed to fetch FMP data for ${ticker}:`, err.message);
    return { yieldPercent: null, dividendRate: null, distributionFrequency: null };
  }
};

export const getCachedHighYieldEtfs = async (req, res) => {
  try {
    console.log('[📥] Fetching cached high-yield ETFs from DB');
    const rows = await executeQuery(`
      SELECT ticker, fund_name, price, yield_percent, high_52w, low_52w,
             dividend_rate, dividend_yield, expense_ratio, dividend_rate_dollars,
             distribution_frequency
      FROM high_yield_etfs
      WHERE fetched_at >= NOW() - INTERVAL 1 DAY
      ORDER BY yield_percent DESC
    `);
    console.log(`[📈] Retrieved ${rows.length} cached high-yield ETFs`);
    if (rows.length === 0) {
      console.warn('[📉] No cached ETF data available — forcing manual fetch');
      return await getHighYieldEtfs(
        { query: { force: 'true' }, headers: { 'x-trigger-openai': 'true' } },
        res
      );
    }
    console.log('[🧾] Sample ETF:', {
      ticker: rows[0].ticker,
      yield_percent: rows[0].yield_percent,
      dividend_rate: rows[0].dividend_rate,
      distribution_frequency: rows[0].distribution_frequency,
    });
    res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to load cached ETF data:', err.message);
    res.status(500).json({ error: 'Failed to fetch cached ETF data' });
  }
};

export const getHighYieldEtfs = async (req, res) => {
  try {
    console.log('[📊] Fetching ETF tickers from curated list');
    const rows = await executeQuery(`SELECT DISTINCT ticker FROM high_yield_etfs`);
    const tickers = new Set(rows.map(row => row.ticker));

    // Inject default tickers if DB is empty and manual trigger is active
    if (tickers.size === 0 && req?.query?.force === 'true' && req?.headers?.['x-trigger-openai'] === 'true') {
      console.warn('[⚠️] No tickers in DB — loading fallback tickers');
      const fallbackTickers = Object.keys(fallbackFrequencies);
      for (const t of fallbackTickers) {
        tickers.add(t);
        try {
          await executeQuery(
            'INSERT IGNORE INTO high_yield_etfs (ticker, fetched_at) VALUES (?, NOW())',
            [t]
          );
          console.log(`[📝] Inserted fallback ticker: ${t}`);
        } catch (err) {
          console.warn(`[⚠️] Failed to insert fallback ticker ${t}:`, err.message);
        }
      }
      res.locals.fallbackLoaded = true;
    }

    // Define shouldScrape at the beginning of the function
    const shouldScrape = req.query.force === 'true' || req.headers['x-trigger-openai'] === 'true';

    const etfs = [];
    const skippedTickers = [];

    for (const ticker of tickers) {
      try {
        const data = await yahooFinance.quote(ticker);
        let dataSource = 'Unknown';
        let dividendRate = data.trailingAnnualDividendRate ?? data.dividendRate ?? null;
        if (dividendRate !== null && dividendRate !== undefined) {
          dataSource = 'Yahoo';
        }
        // [🐍] Use fmp.py if data missing and shouldScrape
        let twelveDataYield = null;
        if ((!dividendRate || !distributionFrequency || !expectedYield) && shouldScrape) {
          try {
            console.log(`[🐍] Running fmp.py for ${ticker}`);
            const output = execSync(`python3 ./controllers/fmp.py ${ticker}`, { encoding: 'utf8' });
            console.log(`[🐍] fmp.py output:\n${output}`);
          } catch (err) {
            console.warn(`[🐍] fmp.py failed for ${ticker}: ${err.message}`);
          }

          const fmpData = await fetchFromFMP(ticker);
          if (!dividendRate && fmpData.dividendRate) {
            dividendRate = fmpData.dividendRate;
            dataSource = 'FMP';
            dynamicDividendRates[ticker] = dividendRate.toFixed(2);
          }
          if (!distributionFrequency && fmpData.distributionFrequency) {
            distributionFrequency = fmpData.distributionFrequency;
            dynamicKnownFrequencies[ticker] = distributionFrequency;
          }
          if (!expectedYield && fmpData.yieldPercent) {
            expectedYield = Math.min(fmpData.yieldPercent, MAX_YIELD).toFixed(2);
            dynamicTableYields[ticker] = expectedYield;
          }
        }
        let distributionFrequency = data.distributionFrequency ?? dynamicKnownFrequencies[ticker] ?? fallbackFrequencies[ticker] ?? null;
        if (data.distributionFrequency) {
          dynamicKnownFrequencies[ticker] = data.distributionFrequency;
          console.log(`[📥] YahooFinance provided distributionFrequency for ${ticker}: ${data.distributionFrequency}`);
        }
        let expectedYield = dynamicTableYields[ticker] ?? fallbackYields[ticker] ?? null;
        let expectedDividendRate = dynamicDividendRates[ticker] ?? fallbackDividendRates[ticker] ?? null;

        // Log skipping scrape if not shouldScrape
        if (!shouldScrape) {
          console.log(`[🔄] Skipping scrape for ${ticker} — frontend fetch only`);
        }

        // Primary fallback: Financial Modeling Prep API
        if ((!dividendRate || !distributionFrequency || !expectedYield) && shouldScrape) {
          // [🐍] Run fallback fmp.py script if data still missing
          try {
            console.log(`[🐍] Running fmp.py for ${ticker}`);
            const output = execSync(`python3 ./controllers/fmp.py ${ticker}`, { encoding: 'utf8' });
            console.log(`[🐍] fmp.py output:\n${output}`);
          } catch (err) {
            console.warn(`[🐍] fmp.py failed for ${ticker}: ${err.message}`);
          }
          const fmpData = await fetchFromFMP(ticker);
          if (!dividendRate && fmpData.dividendRate) {
            dividendRate = fmpData.dividendRate;
            dataSource = 'FMP';
            dynamicDividendRates[ticker] = dividendRate.toFixed(2);
          }
          if (!distributionFrequency && fmpData.distributionFrequency) {
            distributionFrequency = fmpData.distributionFrequency;
            dynamicKnownFrequencies[ticker] = distributionFrequency;
          }
          if (!expectedYield && fmpData.yieldPercent) {
            expectedYield = Math.min(fmpData.yieldPercent, MAX_YIELD).toFixed(2);
            dynamicTableYields[ticker] = expectedYield;
          }
        }

        // Fallback for missing data, use shouldScrape
        if (
          (!dividendRate || !distributionFrequency || !expectedYield) &&
          shouldScrape
        ) {
          console.warn(`[🤖] Attempting OpenAI fallback for ${ticker}: dividendRate=${dividendRate}, frequency=${distributionFrequency}, yield=${expectedYield}`);
          try {
            const aiResp = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [{
                role: 'user',
                content: `Based on your training knowledge only, what is the most likely Dividend Rate in dollars, distribution frequency, and trailing 12-month yield percentage for the ETF ticker "${ticker}"? 
Respond only as a JSON object: {"dividendRate": "X.XX", "distributionFrequency": "Monthly", "yieldPercent": "XX.XX"} — no disclaimers, explanations, or additional text.`
              }],
              temperature: 0,
            });
            const content = aiResp.choices[0]?.message?.content?.trim();
            let aiData;
            try {
              aiData = JSON.parse(content);
              if (aiData.dividendRate && !isNaN(parseFloat(aiData.dividendRate))) {
                dividendRate = parseFloat(aiData.dividendRate);
                dataSource = 'Fallback';
                dynamicDividendRates[ticker] = dividendRate.toFixed(2);
                console.log(`[📥] OpenAI-provided dividendRate for ${ticker}: ${dividendRate}`);
              }
              if (aiData.distributionFrequency && ['Monthly', 'Weekly', 'Quarterly', 'Annually'].includes(aiData.distributionFrequency)) {
                distributionFrequency = aiData.distributionFrequency;
                dynamicKnownFrequencies[ticker] = distributionFrequency;
                console.log(`[📥] OpenAI-provided distributionFrequency for ${ticker}: ${distributionFrequency}`);
              }
              if (aiData.yieldPercent && !isNaN(parseFloat(aiData.yieldPercent))) {
                expectedYield = Math.min(parseFloat(aiData.yieldPercent), MAX_YIELD).toFixed(2);
                dynamicTableYields[ticker] = expectedYield;
                console.log(`[📥] OpenAI-provided yieldPercent for ${ticker}: ${expectedYield}`);
              }
            } catch (parseErr) {
              console.warn(`[⚠️] OpenAI returned unparseable response for ${ticker}: "${content}"`);
            }
          } catch (err) {
            console.error(`[❌] OpenAI error for ${ticker}:`, err.message);
          }
        }

        // External source fallback, use shouldScrape
        if ((!dividendRate || !distributionFrequency || !expectedYield) && shouldScrape) {
          const externalData = await fetchFromExternalSource(ticker);
          if (!dividendRate && externalData.dividendRate) {
            dividendRate = externalData.dividendRate;
            dataSource = 'Fallback';
            dynamicDividendRates[ticker] = dividendRate.toFixed(2);
          }
          if (!distributionFrequency && externalData.distributionFrequency) {
            distributionFrequency = externalData.distributionFrequency;
            dynamicKnownFrequencies[ticker] = distributionFrequency;
          }
          if (!expectedYield && externalData.yieldPercent) {
            expectedYield = Math.min(externalData.yieldPercent, MAX_YIELD).toFixed(2);
            dynamicTableYields[ticker] = expectedYield;
          }
        }

        // Use expectedDividendRate if still missing
        if (!dividendRate && expectedDividendRate) {
          dividendRate = parseFloat(expectedDividendRate);
          dataSource = 'Fallback';
          console.log(`[📥] Using fallback dividendRate for ${ticker}: ${dividendRate}`);
        }

        let dividendRateDollars = dividendRate !== null ? parseFloat(dividendRate).toFixed(2) : null;

        // Yield calculation
        let rawYield = data.trailingAnnualDividendYield ?? data.dividendYield ?? twelveDataYield ?? 0;
        // Set dataSource for rawYield
        if (rawYield === data.trailingAnnualDividendYield || rawYield === data.dividendYield) {
          if (dataSource === 'Unknown') dataSource = 'Yahoo';
        } else if (rawYield === twelveDataYield) {
          if (dataSource === 'Unknown') dataSource = 'TwelveData';
        }
        let yieldPercent = parseFloat(rawYield.toFixed(2));

        // Handle scaling issues
        if (yieldPercent < 20 && expectedYield && yieldPercent * 100 > 20) {
          console.log(`[📥] Scaling yield for ${ticker}: ${yieldPercent}% to ${yieldPercent * 100}%`);
          yieldPercent *= 100;
          dataSource = 'Fallback';
        }

        if (!rawYield || yieldPercent <= 0) {
          console.warn(`[⚠️] ${ticker} has no valid yield data:`, JSON.stringify(data, null, 2));
          if (expectedYield) {
            console.log(`[📥] Using expected yield for ${ticker}: ${expectedYield}%`);
            yieldPercent = parseFloat(expectedYield);
            dataSource = 'Fallback';
          } else {
            skippedTickers.push(ticker);
            continue;
          }
        }

        // Validate yield
        if (expectedYield && Math.abs(yieldPercent - expectedYield) > 50) {
          console.warn(`[⚠️] ${ticker} yield (${yieldPercent}%) deviates significantly from expected (~${expectedYield}%)`);
          yieldPercent = parseFloat(expectedYield);
          dataSource = 'Fallback';
        }

        // [🧠] Verify yield via OpenAI helper if fallback or AI is triggered
        if (shouldScrape && dividendRate && data.regularMarketPrice) {
          const aiYield = await getDividendYieldWithOpenAI(data.regularMarketPrice, dividendRate);
          if (aiYield && Math.abs(aiYield - yieldPercent) > 1) {
            console.log(`[🧠] Corrected yield for ${ticker} via OpenAI: ${yieldPercent} → ${aiYield}`);
            yieldPercent = aiYield;
            dataSource = 'Fallback';
          }
        }

        // Normalize abnormal yield
        if (yieldPercent > 100 && yieldPercent / 100 < 15) {
          yieldPercent = parseFloat((yieldPercent / 100).toFixed(2));
          console.warn(`[⚖️] Normalized excessive yield to ${yieldPercent}%`);
        }

        if (yieldPercent > 20) {
          console.log(`[✅] ${ticker} passed with yield: ${yieldPercent.toFixed(2)}%, frequency: ${distributionFrequency ?? 'Unknown'}, dividendRate: ${dividendRate ?? 'Unknown'}`);
          etfs.push({
            ticker,
            fundName: data.longName ?? ticker,
            price: data.regularMarketPrice ?? null,
            yield: yieldPercent,
            high52w: data.fiftyTwoWeekHigh ?? null,
            low52w: data.fiftyTwoWeekLow ?? null,
            dividendRate,
            dividendYield: data.dividendYield ? parseFloat(data.dividendYield.toFixed(2)) : yieldPercent,
            expenseRatio: parseFloat(data.netExpenseRatio ?? '0.99').toFixed(2),
            dividendRateDollar: dividendRateDollars,
            distributionFrequency: distributionFrequency ?? 'Unknown',
          });

          try {
            await executeQuery(`
              INSERT INTO high_yield_etfs (
                ticker, fund_name, price, yield_percent, high_52w, low_52w,
                dividend_rate, dividend_yield, expense_ratio, dividend_rate_dollars,
                distribution_frequency, data_source, verified_by_ai, fetched_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
              ON DUPLICATE KEY UPDATE
                price = VALUES(price),
                yield_percent = VALUES(yield_percent),
                high_52w = VALUES(high_52w),
                low_52w = VALUES(low_52w),
                dividend_rate = VALUES(dividend_rate),
                dividend_yield = VALUES(dividend_yield),
                expense_ratio = VALUES(expense_ratio),
                dividend_rate_dollars = VALUES(dividend_rate_dollars),
                distribution_frequency = VALUES(distribution_frequency),
                data_source = VALUES(data_source),
                verified_by_ai = 1,
                fetched_at = NOW()
            `, [
              ticker,
              data.longName ?? ticker,
              data.regularMarketPrice ?? null,
              yieldPercent,
              data.fiftyTwoWeekHigh ?? null,
              data.fiftyTwoWeekLow ?? null,
              dividendRate,
              data.dividendYield ? parseFloat(data.dividendYield.toFixed(2)) : yieldPercent,
              parseFloat(data.netExpenseRatio ?? '0.99').toFixed(2),
              dividendRateDollars,
              distributionFrequency ?? 'Unknown',
              dataSource,
            ]);
            console.log(`[💾] Inserted/Updated ${ticker} in DB with frequency: ${distributionFrequency ?? 'Unknown'}, dividendRate: ${dividendRate ?? 'Unknown'}, dataSource: ${dataSource}`);
          } catch (dbErr) {
            console.error(`[💾] DB insert failed for ${ticker}: ${dbErr.message}`);
          }
        }
      } catch (innerErr) {
        console.warn(`[⚠️] Skipped ${ticker}: ${innerErr.message}`);
        skippedTickers.push(ticker);
      }
    }

    console.log(`[📬] Found ${etfs.length} ETFs with yield > 20% from ${tickers.size} tickers checked`);
    console.log(`[⚠️] Skipped tickers:`, skippedTickers);

    res.json(etfs);

    if (res.locals?.fallbackLoaded) {
      console.log('[⚠️] Fallback tickers were inserted and fetched.');
    }

    try {
      const recent = await executeQuery(`
        SELECT ticker, fund_name, price, yield_percent, dividend_rate, distribution_frequency, fetched_at
        FROM high_yield_etfs
        WHERE fetched_at >= NOW() - INTERVAL 1 HOUR
        ORDER BY fetched_at DESC
        LIMIT 10
      `);
      console.log('[🧾] Recently inserted high-yield ETFs:');
      console.table(recent);
    } catch (logErr) {
      console.warn('[📉] Failed to fetch recent insertions:', logErr.message);
    }
    return;
  } catch (err) {
    console.error('[❌] High-yield ETF fetch failed:', err.message);
    return res.status(500).json({ error: 'Failed to fetch high-yield ETFs' });
  }
};

cron.schedule('0 8,20 * * *', async () => {
  console.log('[⏰] Daily ETF refresh starting (8AM/8PM PST)');
  await runOpenAIUpdate({ query: { force: 'true' }, headers: { 'x-trigger-openai': 'true' } }, {
    json: (data) => console.log('[✅] Daily ETF data refreshed', data.length),
    status: (code) => ({
      json: (err) => console.error(`[❌] Status ${code}:`, err),
    }),
  });
}, {
  timezone: 'America/Los_Angeles'
});

export const runOpenAIUpdate = async (req, res) => {
  console.log('[⚙️] Triggering manual OpenAI refresh...');
  await updateDynamicData(); // Run updates only on manual trigger

  // Patch: Reinsert incomplete tickers before update
  const incompleteTickers = await getIncompleteTickers();
  if (incompleteTickers.length > 0) {
    console.log('[🩹] Reinserting incomplete tickers for update:', incompleteTickers);
    for (const t of incompleteTickers) {
      try {
        await executeQuery(
          'INSERT INTO high_yield_etfs (ticker, fetched_at) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE fetched_at = NOW()',
          [t]
        );
      } catch (err) {
        console.warn(`[⚠️] Failed to reinsert ${t}:`, err.message);
      }
    }
  }

  // Force reinsert fallback tickers if DB is still empty
  const tickersResult = await executeQuery(`SELECT COUNT(*) as count FROM high_yield_etfs`);
  if (tickersResult[0]?.count === 0) {
    console.warn('[⚠️] ETF table is still empty — reloading fallback tickers');
    const fallbackTickers = Object.keys(fallbackFrequencies);
    for (const t of fallbackTickers) {
      try {
        await executeQuery(
          'INSERT IGNORE INTO high_yield_etfs (ticker, fetched_at) VALUES (?, NOW())',
          [t]
        );
        console.log(`[📝] Inserted fallback ticker during retry: ${t}`);
      } catch (err) {
        console.warn(`[⚠️] Failed to insert fallback ticker during retry ${t}:`, err.message);
      }
    }
  }

  if (!req.query) req.query = {};
  if (!req.headers) req.headers = {};
  req.query.force = 'true';
  req.headers['x-trigger-openai'] = 'true';
  await getHighYieldEtfs(req, res);
};

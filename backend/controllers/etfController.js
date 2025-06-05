const FMP_API_KEY = process.env.FMP_API_KEY || 'KbZqIumPoV2pkLZk2V4XUmXRef5czO5Q';
import { execSync } from 'child_process';
import { executeQuery } from '../utils/db.js';
import cron from 'node-cron';
import axios from 'axios';
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

let dynamicTableYields = {};
let dynamicKnownFrequencies = {};
let dynamicDividendRates = {}; // Added declaration
let lastDynamicUpdate = null;

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

// Fetch yield, frequency, and dividend rate from external source (using summary mode)
const fetchFromFMP = async (ticker) => {
  try {
    const command = `python3 /home/bitnami/scripts/financial/investment-tracker/backend/controllers/fmp.py summary ${ticker}`;
    const output = execSync(command).toString();
    const result = JSON.parse(output);

    // Destructure expanded fields from result
    let {
      yield_percent: yieldPercent,
      dividend_rate: dividendRate,
      distribution_frequency: distributionFrequency,
      earnings_yield_ttm,
      description,
      sector,
      industry,
      price,
      name,
      market_cap,
      dividend_yield,
      expense_ratio,
      high_52w,
      low_52w,
      fund_name,
      exchange,
    } = result;

    // Fallback logic for fund_name and exchange if fund_name is null
    if (!fund_name) {
      try {
        // Fetch search-symbol endpoint for fallback
        const searchResp = await axios.get(
          `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(ticker)}&limit=1&apikey=${FMP_API_KEY}`
        );
        if (Array.isArray(searchResp.data) && searchResp.data.length > 0) {
          if (!fund_name && searchResp.data[0].name) fund_name = searchResp.data[0].name;
          if (!exchange && searchResp.data[0].exchangeShortName) exchange = searchResp.data[0].exchangeShortName;
        }
      } catch (fallbackErr) {
        console.warn(`[⚠️] Fallback /search-symbol failed for ${ticker}:`, fallbackErr.message);
      }
    }

    // Begin new yieldPercent/dividendRate/price parsing logic
    const parsedDividendRate = dividendRate !== undefined && dividendRate !== null ? parseFloat(dividendRate) : null;
    const parsedPrice = price !== undefined && price !== null ? parseFloat(price) : null;

    if (yieldPercent !== undefined && yieldPercent !== null) {
      yieldPercent = parseFloat(yieldPercent);
    } else if (parsedDividendRate && parsedPrice && parsedPrice > 0) {
      yieldPercent = parseFloat(((parsedDividendRate / parsedPrice) * 100).toFixed(2));
    } else {
      yieldPercent = null;
    }

    // Log main fields, but also destructure additional fields for potential future use
    console.log(`[📥] FMP (Python) for ${ticker}: yield=${yieldPercent}, rate=${dividendRate}, freq=${distributionFrequency}`);
    // Optionally log extra fields for debugging/future use (commented out)
    // console.log(`[📥] Extra FMP fields:`, { earnings_yield_ttm, description, sector, industry, price, name, market_cap, dividend_yield, expense_ratio });
    return {
      yieldPercent,
      dividendRate,
      distributionFrequency,
      name,
      price,
      high_52w: high_52w || null,
      low_52w: low_52w || null,
      expense_ratio,
      fund_name,
      dividend_yield,
      exchange: exchange || null
    };
  } catch (err) {
    console.warn(`[⚠️] Failed to fetch FMP data for ${ticker} via Python script:`, err.message);
    return { yieldPercent: null, dividendRate: null, distributionFrequency: null, name: null, price: null, high_52w: null, low_52w: null, expense_ratio: null, fund_name: null, exchange: null };
  }
};

// Manual FMP fetch endpoint for frontend to trigger data fetch for a given ETF ticker
export const manualFetchFromFMP = async (req, res) => {
  const ticker = req.query?.ticker;
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required as query parameter' });
  }

  try {
    console.log(`[📥] Manually triggering FMP fetch for ${ticker}`);
    const fmpData = await fetchFromFMP(ticker);
    return res.json({ ticker, ...fmpData });
  } catch (err) {
    console.error(`[❌] Manual FMP fetch failed for ${ticker}:`, err.message);
    return res.status(500).json({ error: 'Failed to fetch from FMP' });
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
    res.json(rows.map(row => ({
      ticker: row.ticker,
      fundName: row.fund_name || row.ticker,
      price: row.price,
      yield: row.yield_percent,
      high52w: row.high_52w,
      low52w: row.low_52w,
      dividendRate: row.dividend_rate,
      dividendYield: row.dividend_yield,
      expenseRatio: row.expense_ratio,
      dividendRateDollar: row.dividend_rate_dollars,
      distributionFrequency: row.distribution_frequency,
    })));
  } catch (err) {
    console.error('[❌] Failed to load cached ETF data:', err.message);
    res.status(500).json({ error: 'Failed to fetch cached ETF data' });
  }
};

export const getHighYieldEtfs = async (req, res) => {
  try {
    console.log('[📊] Fetching ETF tickers from curated list');

    if (req.query.useCache === 'true') {
      const recent = await executeQuery(`
        SELECT ticker, fund_name, price, yield_percent, high_52w, low_52w,
               dividend_rate, dividend_yield, expense_ratio, dividend_rate_dollars,
               distribution_frequency
        FROM high_yield_etfs
        WHERE fetched_at >= NOW() - INTERVAL 1 DAY
        ORDER BY yield_percent DESC
      `);
      console.log(`[📈] Served ${recent.length} cached high-yield ETFs`);
      return res.json(recent);
    }

    const rows = await executeQuery(`SELECT DISTINCT ticker FROM high_yield_etfs`);
    const tickers = new Set(rows.map(row => row.ticker));

    // Inject default tickers if DB is empty and manual trigger is active
    if (tickers.size === 0 && req?.query?.force === 'true' && req?.headers?.['x-trigger-openai'] === 'true') {
      console.warn('[⚠️] No tickers in DB — loading fallback tickers');
      const fallbackData = await loadFallbackEtfData();
      const fallbackTickers = Object.keys(fallbackData.frequencies);
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

    const etfs = [];
    const skippedTickers = [];

    for (const ticker of tickers) {
      try {
        // Only use fetchFromFMP and fmp.py
        console.log(`[📥] Fetching FMP data for ${ticker}`);
        const fmpData = await fetchFromFMP(ticker);
        // Parse numeric values as needed
        const expectedYield = fmpData.yieldPercent !== undefined && fmpData.yieldPercent !== null ? parseFloat(fmpData.yieldPercent) : null;
        const dividendRate = fmpData.dividendRate !== undefined && fmpData.dividendRate !== null ? parseFloat(fmpData.dividendRate) : null;
        const dividendYield = fmpData.dividend_yield !== undefined && fmpData.dividend_yield !== null
          ? parseFloat(fmpData.dividend_yield)
          : expectedYield;
        const distributionFrequency = fmpData.distributionFrequency ?? 'Unknown';
        const fundName =
          (fmpData.fund_name && fmpData.fund_name !== null)
            ? fmpData.fund_name
            : (fmpData.name && fmpData.name !== null)
              ? fmpData.name
              : ticker;
        const exchange = fmpData.exchange || null;
        etfs.push({
          ticker,
          fundName: fundName,
          price: fmpData.price || null,
          yield: expectedYield,
          high52w: fmpData.high_52w || null,
          low52w: fmpData.low_52w || null,
          dividendRate,
          dividendYield: dividendYield,
          expenseRatio: fmpData.expense_ratio || null,
          dividendRateDollar: dividendRate !== null && dividendRate !== undefined ? dividendRate.toFixed(2) : null,
          distributionFrequency: distributionFrequency, // For response only
          exchange: exchange,
        });
        try {
          await executeQuery(`
            INSERT INTO high_yield_etfs (
              ticker, fund_name, price, yield_percent, high_52w, low_52w,
              dividend_yield, expense_ratio,
              exchange, data_source, verified_by_ai, fetched_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE
              price = VALUES(price),
              yield_percent = VALUES(yield_percent),
              high_52w = VALUES(high_52w),
              low_52w = VALUES(low_52w),
              dividend_yield = VALUES(dividend_yield),
              expense_ratio = VALUES(expense_ratio),
              exchange = VALUES(exchange),
              data_source = VALUES(data_source),
              verified_by_ai = 1,
              fetched_at = NOW()
          `, [
            ticker,
            fundName,
            fmpData.price || null,
            expectedYield,
            fmpData.high_52w || null,
            fmpData.low_52w || null,
            dividendYield,
            fmpData.expense_ratio || null,
            exchange,
            'FMP',
          ]);
          console.log(`[💾] Inserted/Updated ${ticker} in DB`);
        } catch (dbErr) {
          console.error(`[💾] DB insert failed for ${ticker}: ${dbErr.message}`);
        }
      } catch (innerErr) {
        console.warn(`[⚠️] Skipped ${ticker}: ${innerErr.message}`);
        skippedTickers.push(ticker);
      }
    }

    console.log(`[📬] Found ${etfs.length} ETFs from ${tickers.size} tickers checked`);
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
  await runFmpUpdate({ query: { force: 'true' }, headers: { 'x-trigger-openai': 'true' } }, {
    json: (data) => console.log('[✅] Daily ETF data refreshed', data.length),
    status: (code) => ({
      json: (err) => console.error(`[❌] Status ${code}:`, err),
    }),
  });
}, {
  timezone: 'America/Los_Angeles'
});

export const runFmpUpdate = async (req, res) => {
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
    const fallbackData = await loadFallbackEtfData();
    const fallbackTickers = Object.keys(fallbackData.frequencies);
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

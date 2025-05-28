export const runOpenAIUpdate = async (req, res) => {
  console.log('[🚨] Manual OpenAI ETF update triggered');
  try {
    await getHighYieldEtfs(req, res);
  } catch (err) {
    console.error('[❌] Manual ETF update failed:', err.message);
    res.status(500).json({ error: 'Manual ETF update failed' });
  }
};
import { executeQuery } from '../utils/db.js';
import yahooFinance from 'yahoo-finance2';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import cron from 'node-cron';
// import { utcToZonedTime } from 'date-fns-tz';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let lastOpenAIFetch = null;

export const shouldFetchFromOpenAI = () => {
  const now = new Date();
  // Only fetch if never fetched, or more than 12 hours passed
  return !lastOpenAIFetch || ((now - lastOpenAIFetch) > 1000 * 60 * 60 * 12);
};

export const markOpenAIFetch = () => {
  lastOpenAIFetch = new Date();
};

export const getHighYieldEtfs = async (req, res) => {
  try {
    console.log('[📊] Fetching ETF tickers from curated list');

    const rows = await executeQuery(`SELECT DISTINCT ticker FROM high_yield_etfs`);
    const tickers = new Set(rows.map(row => row.ticker));

    const prompt = `
Return only a valid JSON array of ETF tickers that yield above 20% and use options income strategies (like MSTY, AIYY, FIAT).

ONLY return a JSON array. Do not include any commentary or explanation.

Example: ["MSTY", "AIYY", "FIAT"]
`;

    // Remove OpenAI call from this function; only cron or manual trigger should call OpenAI.
    console.log('[⏩] Skipping OpenAI call — only used in cron or manual trigger.');

    const etfs = [];

    for (const ticker of tickers) {
      try {
        const data = await yahooFinance.quote(ticker);
        let dividendRate = data.trailingAnnualDividendRate ?? data.dividendRate ?? null;

        if (!dividendRate && (req.query.force === 'true' || req.headers['x-trigger-openai'] === 'true')) {
          console.warn(`[🤖] Attempting OpenAI fallback for missing dividend rate: ${ticker}`);
          try {
            const aiResp = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [{
                role: 'user',
                content: `What is the most recent Dividend Rate in dollars for the ETF with ticker symbol "${ticker}"? Respond with only a numeric value (e.g., 1.45).`,
              }],
              temperature: 0,
            });
            const content = aiResp.choices[0]?.message?.content?.trim();
            if (content && !isNaN(parseFloat(content))) {
              dividendRate = parseFloat(content);
              console.log(`[📥] Using OpenAI-provided dividendRateDollars for ${ticker}: ${dividendRate}`);
              console.log(`[💡] OpenAI provided dividend rate for ${ticker}: ${dividendRate}`);
            } else {
              console.warn(`[⚠️] OpenAI returned unparseable response for ${ticker}: "${content}"`);
            }
          } catch (err) {
            console.error(`[❌] OpenAI error for ${ticker}:`, err.message);
          }
        }
        let dividendRateDollars = dividendRate !== null ? parseFloat(dividendRate).toFixed(2) : null;

        // If dividendRateDollars is still null and force or OpenAI trigger is true, fallback to OpenAI
        if (dividendRateDollars === null && (req.query.force === 'true' || req.headers['x-trigger-openai'] === 'true')) {
          console.warn(`[🤖] Attempting OpenAI fallback for dividend rate dollars: ${ticker}`);
          try {
            const aiResp = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [{
                role: 'user',
                content: `What is the latest Dividend Rate in dollars (not yield %) for ETF "${ticker}"? Only provide a numeric response like 1.23.`,
              }],
              temperature: 0,
            });
            const aiContent = aiResp.choices[0]?.message?.content?.trim();
            if (aiContent && !isNaN(parseFloat(aiContent))) {
              dividendRateDollars = parseFloat(aiContent).toFixed(2);
              console.log(`[📥] OpenAI-provided dividend_rate_dollars for ${ticker}: ${dividendRateDollars}`);
            } else {
              console.warn(`[⚠️] OpenAI fallback dividend_rate_dollars unparseable for ${ticker}: "${aiContent}"`);
            }
          } catch (err) {
            console.error(`[❌] OpenAI error for dividend_rate_dollars on ${ticker}:`, err.message);
          }
        }

        const rawYield = data.trailingAnnualDividendYield ?? data.dividendYield;
        if (!rawYield) {
          console.warn(`[⚠️] ${ticker} has no yield data or malformed response:\n`, JSON.stringify(data, null, 2));
          continue;
        }

        const yieldPercent = parseFloat((rawYield * 100).toFixed(2));
        const expenseRatio = data.netExpenseRatio ?? '0.99';

        if (yieldPercent > 20) {
          console.log(`[✅] ${ticker} passed with yield: ${yieldPercent.toFixed(2)}%`);
          etfs.push({
            ticker,
            fundName: data.longName ?? ticker,
            price: data.regularMarketPrice ?? null,
            yield: yieldPercent,
            high52w: data.fiftyTwoWeekHigh ?? null,
            low52w: data.fiftyTwoWeekLow ?? null,
            dividendRate,
            dividendYield: data.dividendYield ? (data.dividendYield * 100).toFixed(2) : null,
            expenseRatio: expenseRatio,
            dividendRateDollar: dividendRateDollars,
          });
          try {
            await executeQuery(`
              INSERT INTO high_yield_etfs (
                ticker, fund_name, price, yield_percent, high_52w, low_52w,
                dividend_rate, dividend_yield, expense_ratio, dividend_rate_dollars, fetched_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              ON DUPLICATE KEY UPDATE
                price = VALUES(price),
                yield_percent = VALUES(yield_percent),
                high_52w = VALUES(high_52w),
                low_52w = VALUES(low_52w),
                dividend_rate = VALUES(dividend_rate),
                dividend_yield = VALUES(dividend_yield),
                expense_ratio = VALUES(expense_ratio),
                dividend_rate_dollars = VALUES(dividend_rate_dollars),
                fetched_at = NOW()
            `, [
              ticker,
              data.longName ?? ticker,
              data.regularMarketPrice ?? null,
              yieldPercent,
              data.fiftyTwoWeekHigh ?? null,
              data.fiftyTwoWeekLow ?? null,
              dividendRate,
              data.dividendYield ? (data.dividendYield * 100).toFixed(2) : null,
              expenseRatio,
              dividendRateDollars
            ]);
          } catch (dbErr) {
            console.error(`[💾] DB insert failed for ${ticker}: ${dbErr.message}`);
          }
        }
      } catch (innerErr) {
        console.warn(`[⚠️] Skipped ${ticker}: ${innerErr.message}`);
      }
    }

    console.log(`[📬] Found ${etfs.length} ETFs with yield > 20% from ${tickers.size} tickers checked`);
    res.json(etfs);
    // Log recently inserted high-yield ETFs
    try {
      const recent = await executeQuery(`
        SELECT ticker, fund_name, price, yield_percent, fetched_at
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

export const getCachedHighYieldEtfs = async (req, res) => {
  try {
    console.log('[📥] Fetching cached high-yield ETFs from DB');
    const rows = await executeQuery(`
      SELECT ticker, fund_name, price, yield_percent, high_52w, low_52w,
             dividend_rate, dividend_yield, expense_ratio, dividend_rate_dollars
      FROM high_yield_etfs
      WHERE fetched_at >= NOW() - INTERVAL 1 DAY
      ORDER BY yield_percent DESC
    `);
    console.log(`[📈] Retrieved ${rows.length} cached high-yield ETFs`);
    res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to load cached ETF data:', err.message);
    res.status(500).json({ error: 'Failed to fetch cached ETF data' });
  }
};

cron.schedule('0 8 * * *', async () => {
  console.log('[⏰] Daily ETF refresh starting (8AM PST)');
  const now = new Date();
  // const pstTime = utcToZonedTime(now, 'America/Los_Angeles');

  // Simulate Express req/res for auto-call
  const dummyReq = { query: {}, headers: { 'x-trigger-openai': 'true' } };
  const dummyRes = {
    json: (data) => console.log('[✅] Daily ETF data refreshed', data.length),
    status: (code) => ({
      json: (err) => console.error(`[❌] Status ${code}:`, err),
    }),
  };
  await getHighYieldEtfs(dummyReq, dummyRes);
}, {
  timezone: 'America/Los_Angeles'
});

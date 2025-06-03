import axios from 'axios';
import { differenceInWeeks, format } from 'date-fns';
import { calculateCompoundedDividends } from '../utils/compoundCalculator.js';
import { executeQuery } from '../utils/db.js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';
import { fetchHistoricalPrice, simulateAutoCompounding, fetchPriceFromFMP, fetchMSTRFromMarketWatch, dividendPerShare } from '../scripts/yieldCalc.js';
import { execFile } from 'child_process';
import { promisify } from 'util';

// For direct DB access for investment list
import mysql from 'mysql2/promise';


// Create a DB connection pool (adjust config as needed)
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'investment_tracker',
});
export const getInvestmentSummary = async (req, res) => {
  const { email } = req.user;
  console.log(`[📩] Using authenticated email: ${email}`);

  const cacheTtlMs = parseInt(process.env.INVESTMENT_CACHE_TTL || '3600', 10) * 1000;
  try {
    const cacheRows = await executeQuery(
      'SELECT summary, UNIX_TIMESTAMP(updated_at) AS ts FROM user_investment_summaries WHERE email = ?',
      [email]
    );
    if (cacheRows.length > 0) {
      const { summary, ts } = cacheRows[0];
      const age = Date.now() - ts * 1000;
      if (age < cacheTtlMs) {
        console.log(`[🗄️] Returning cached investment summary for ${email} (age ${age}ms)`);
        return res.json(JSON.parse(summary));
      }
    }
  } catch (err) {
    console.warn(`[⚠️] Failed to retrieve cached investment summary: ${err.message}`);
  }

  const { start_date, end_date, track_dividends } = req.query;
  let shouldTrackDividends = track_dividends !== 'false';

  let symbol = 'MSTY';
  let initialShares = 6;
  let investedAt = new Date();
  let weeksElapsed = 12;
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  const cachePath = path.resolve('dividends-cache.json');

  // Retry helper for API calls
  const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`[🔄] Retry ${i + 1}/${retries} after ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  try {
    // Database query
    const query = 'SELECT CAST(shares AS DECIMAL(10,4)) AS shares, CAST(invested_at AS DATETIME) AS invested_at, symbol, track_dividends FROM user_investments WHERE email = ?';
    console.log(`[📥] Executing query: "${query}" with [${email}]`);
    const rows = await executeQuery(query, [email]);

    if (rows.length === 0) {
      console.warn(`[⚠️] No investment record found for email: ${email}. Using defaults.`);
    } else {
      const { shares, invested_at, symbol: dbSymbol, track_dividends: dbTrack } = rows[0];
      initialShares = shares;
      if (!invested_at) {
        investedAt = new Date();
        await executeQuery('UPDATE user_investments SET invested_at = ? WHERE email = ?', [investedAt.toISOString().split('T')[0], email]);
        console.log(`[📝] Set missing invested_at date for ${email} to ${investedAt.toISOString().split('T')[0]}`);
      } else {
        investedAt = new Date(invested_at);
      }
      weeksElapsed = differenceInWeeks(new Date(), investedAt);
      console.log(`[✅] DB fetch success — shares: ${shares}, invested_at: ${invested_at}`);
      symbol = dbSymbol || symbol;
      if (track_dividends === undefined) {
        shouldTrackDividends = dbTrack === 1;
      }
    }

    weeksElapsed = Math.floor(weeksElapsed);

    // Validate symbol
    let symbolValid = false;
    try {
      const testResponse = await retry(() =>
        axios.get('https://api.twelvedata.com/quote', {
          params: { symbol, apikey: twelveDataKey }
        })
      );
      if (testResponse.data.close && testResponse.data.symbol === symbol) {
        symbolValid = true;
        console.log(`[✅] Symbol ${symbol} is supported by Twelve Data`);
      }
    } catch (err) {
      console.warn(`[⚠️] Symbol ${symbol} may not be supported: ${err.message}`);
    }
    if (!symbolValid) {
      console.warn(`[⚠️] Falling back to default values for ${symbol}`);
    }

    // Fetch initial price at invested_at
    let initialPrice = 0;
    try {
      const timeSeriesResponse = await retry(() =>
        axios.get('https://api.twelvedata.com/time_series', {
          params: {
            symbol,
            apikey: twelveDataKey,
            interval: '1day',
            start_date: format(investedAt, 'yyyy-MM-dd'),
            end_date: format(investedAt, 'yyyy-MM-dd')
          }
        })
      );
      const data = timeSeriesResponse.data.values;
      if (data && data.length > 0) {
        initialPrice = parseFloat(data[0].close) || 0;
        console.log(`[📈] Initial price at ${investedAt.toISOString().split('T')[0]}: $${initialPrice}`);
      }
    } catch (err) {
      console.warn(`[⚠️] Failed to fetch initial price: ${err.message}. Will use current price as fallback.`);
    }

    // Dividend fetching
    const fetchDividends = async () => {
      try {
        const response = await retry(() =>
          axios.get('https://api.twelvedata.com/dividends', {
            params: {
              symbol,
              apikey: twelveDataKey,
            start_date: start_date || (weeksElapsed < 1 ? '2020-01-01' : investedAt.toISOString().split('T')[0]),
            end_date: end_date || new Date().toISOString().split('T')[0]
            }
          })
        );
        console.log(`[🌐] Twelve Data dividend response for ${symbol}`);
        fs.writeFileSync(cachePath, JSON.stringify(response.data, null, 2));
        console.log('[💾] Cached dividend data');
        return response.data.dividends || [];
      } catch (err) {
        console.error(`[❌] Dividend fetch error: ${err.message}`);
        if (fs.existsSync(cachePath)) {
          console.log('[🗂️] Using cached dividends');
          return JSON.parse(fs.readFileSync(cachePath, 'utf-8')).dividends || [];
        }
        throw new Error('No dividend data or cache available');
      }
    };

    // Process dividends
    let dividendData = [];
    if (shouldTrackDividends) {
      dividendData = await fetchDividends();
    } else {
      console.log(`[ℹ️] Skipping dividend fetch as track_dividends=false`);
    }
    const dividendValues = dividendData
      .map(div => parseFloat(div.amount) || 0)
      .filter(amount => amount > 0);
    const totalDividend = dividendValues.reduce((a, b) => a + b, 0);
    const avgWeeklyDividend = dividendValues.length ? totalDividend / dividendValues.length : 0.1;
    console.log(`[💰] Dividend values: ${dividendValues}`);
    console.log(`[📈] Average weekly dividend: $${avgWeeklyDividend.toFixed(4)}`);
    console.log(`[⏳] Weeks since investment: ${weeksElapsed}`);

    // Handle < 1 week case
    if (weeksElapsed < 1) {
      console.warn(`[⛔️] Less than one week elapsed. Showing anticipated earnings.`);

      // Calculate compounded dividends
      const compResult = calculateCompoundedDividends(initialShares, avgWeeklyDividend, 1);
      console.log(`[🔍] Compounded result:`, JSON.stringify(compResult));
      const earnedShares = typeof compResult.totalShares === 'number' && !isNaN(compResult.totalShares)
        ? parseFloat(compResult.totalShares)
        : 0;
      const totalSharesSum = Number(initialShares) + Number(earnedShares);
      const safeTotalShares = isNaN(totalSharesSum) ? initialShares : parseFloat(totalSharesSum.toFixed(4));
      const safeTotalDividends = typeof compResult.totalDividends === 'number' && !isNaN(compResult.totalDividends)
        ? compResult.totalDividends
        : 0;

      // Fetch live price
      let currentSharePrice = avgWeeklyDividend * 3;
      try {
        const quoteResponse = await retry(() =>
          axios.get('https://api.twelvedata.com/quote', {
            params: { symbol, apikey: twelveDataKey }
          })
        );
        currentSharePrice = parseFloat(quoteResponse.data.close || '0');
        console.log(`[📈] Live quote price for anticipated case: $${currentSharePrice}`);
      } catch (err) {
        console.warn(`[⚠️] Failed to fetch live quote: ${err.message}. Using fallback price.`);
      }

      // Use current price as initial if not fetched
      const effectiveInitialPrice = initialPrice || currentSharePrice || avgWeeklyDividend * 3;

      // Profit/Loss = (Current Value + Dividends) - Initial Investment
      const currentPortfolioValue = safeTotalShares * currentSharePrice;
      const initialInvestment = initialShares * effectiveInitialPrice;
      const profitOrLossUsd = parseFloat((currentPortfolioValue + safeTotalDividends - initialInvestment).toFixed(2));
      const totalInvestmentUsd = parseFloat(currentPortfolioValue.toFixed(2));

      console.log(`[💵] Profit/Loss calc: CurrentValue=$${currentPortfolioValue}, Dividends=$${safeTotalDividends}, Initial=$${initialInvestment}`);

      const result = {
        symbol,
        investedAt: investedAt.toISOString().split('T')[0],
        weeksElapsed,
        totalShares: safeTotalShares,
        totalDividends: safeTotalDividends,
        weeklyDividendPerShare: avgWeeklyDividend,
        initialShares,
        totalInvestmentUsd, // Current portfolio value
        currentSharePrice,
        profitOrLossUsd,
        earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
        initialInvestment: parseFloat(initialInvestment.toFixed(2)),
        roiPercent: initialInvestment > 0
          ? parseFloat(((profitOrLossUsd / initialInvestment) * 100).toFixed(2))
          : 0,
        source: currentSharePrice !== avgWeeklyDividend * 3 ? 'twelve-data' : 'anticipated',
        isAnticipated: true
      };
      try {
        await executeQuery(
          `REPLACE INTO user_investment_summaries (email, summary) VALUES (?, ?)`,
          [email, JSON.stringify(result)]
        );
        console.log(`[💾] Cached investment summary for ${email}`);
      } catch (err) {
        console.error(`[❌] Failed to cache investment summary: ${err.message}`);
      }
      return res.json(result);
    }

    // Live price via WebSocket
    let currentSharePrice = 0;
    const wsPromise = new Promise((resolve) => {
      const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?symbol=${symbol}&apikey=${twelveDataKey}`);
      ws.on('open', () => {
        console.log(`[🌐] WebSocket connected for ${symbol}`);
        ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: symbol } }));
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.event === 'price' && msg.symbol === symbol) {
            currentSharePrice = parseFloat(msg.price) || 0;
            console.log(`[📈] Live price via WebSocket: $${currentSharePrice}`);
            ws.close();
            resolve();
          }
        } catch (err) {
          console.error(`[❌] WebSocket parse error: ${err.message}`);
        }
      });
      ws.on('error', (err) => {
        console.error(`[❌] WebSocket error: ${err.message}`);
        resolve();
      });
      setTimeout(() => {
        console.warn('[⏰] WebSocket timeout');
        ws.close();
        resolve();
      }, 5000);
    });

    await wsPromise;

    // Fallback to REST
    if (!currentSharePrice) {
      console.log('[🔄] Falling back to REST /quote endpoint');
      try {
        const quoteResponse = await retry(() =>
          axios.get('https://api.twelvedata.com/quote', {
            params: { symbol, apikey: twelveDataKey }
          })
        );
        currentSharePrice = parseFloat(quoteResponse.data.close || '0');
        console.log(`[📈] REST quote price: $${currentSharePrice}`);
      } catch (err) {
        console.error(`[❌] REST quote error: ${err.message}`);
      }
    }

    // Calculate results
    const result = calculateCompoundedDividends(initialShares, avgWeeklyDividend, weeksElapsed);
    console.log(`[🔍] Compounded result:`, JSON.stringify(result));
    const earnedShares = typeof result.totalShares === 'number' && !isNaN(result.totalShares)
      ? parseFloat(result.totalShares)
      : 0;
    const totalSharesSum = Number(initialShares) + Number(earnedShares);
    const safeTotalShares = isNaN(totalSharesSum) ? initialShares : parseFloat(totalSharesSum.toFixed(4));
    const safeTotalDividends = typeof result.totalDividends === 'number' && !isNaN(result.totalDividends)
      ? result.totalDividends
      : 0;

    // Use current price as initial if not fetched
    const effectiveInitialPrice = initialPrice || currentSharePrice || avgWeeklyDividend * 3;

    // Profit/Loss = (Current Value + Dividends) - Initial Investment
    const currentPortfolioValue = safeTotalShares * currentSharePrice;
    const initialInvestment = initialShares * effectiveInitialPrice;
    const profitOrLossUsd = parseFloat((currentPortfolioValue + safeTotalDividends - initialInvestment).toFixed(2));
    const totalInvestmentUsd = parseFloat(currentPortfolioValue.toFixed(2));

    console.log(`[💵] Profit/Loss calc: CurrentValue=$${currentPortfolioValue}, Dividends=$${safeTotalDividends}, Initial=$${initialInvestment}`);

    const freshResult = {
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      totalShares: safeTotalShares,
      totalDividends: safeTotalDividends,
      weeklyDividendPerShare: avgWeeklyDividend,
      initialShares,
      totalInvestmentUsd, // Current portfolio value
      currentSharePrice,
      profitOrLossUsd,
      earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
      initialInvestment: parseFloat(initialInvestment.toFixed(2)),
      roiPercent: initialInvestment > 0
        ? parseFloat(((profitOrLossUsd / initialInvestment) * 100).toFixed(2))
        : 0,
      source: currentSharePrice ? 'twelve-data' : 'fallback',
      isAnticipated: false
    };
    try {
      await executeQuery(
        `REPLACE INTO user_investment_summaries (email, summary) VALUES (?, ?)`,
        [email, JSON.stringify(freshResult)]
      );
      console.log(`[💾] Cached investment summary for ${email}`);
    } catch (err) {
      console.error(`[❌] Failed to cache investment summary: ${err.message}`);
    }
    res.json(freshResult);
  } catch (err) {
    console.error(`[❌] Error: ${err.message}`);
    try {
      const cacheRows = await executeQuery(
        'SELECT summary FROM user_investment_summaries WHERE email = ?',
        [email]
      );
      if (cacheRows.length > 0) {
        console.log(`[🗄️] Serving cached investment summary after error for ${email}`);
        return res.json(JSON.parse(cacheRows[0].summary));
      }
    } catch (cacheErr) {
      console.error(`[❌] Failed to fetch cached investment summary: ${cacheErr.message}`);
    }
    res.status(500).json({
      error: 'Failed to fetch data from Twelve Data',
      details: err.message,
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      initialShares,
      totalShares: initialShares,
      totalDividends: 0,
      weeklyDividendPerShare: 0,
      totalInvestmentUsd: 0,
      currentSharePrice: 0,
      profitOrLossUsd: 0,
      earnedShares: 0,
      initialInvestment: 0,
      roiPercent: 0,
      source: 'error-fallback',
      isAnticipated: true
    });
  }
};

// Add an investment record for authenticated user (allows multiple per symbol)
export const addInvestment = async (req, res) => {
  console.log('addInvestment payload:', req.body);
  const { email } = req.user;
  const { symbol, shares, invested_at, track_dividends } = req.body;
  if (!symbol || shares == null || !invested_at) {
    return res.status(400).json({ error: 'symbol, shares and invested_at are required' });
  }
  try {
    // Check if a position for the same symbol already exists for this user
    const rows = await executeQuery(
      'SELECT id FROM user_investments WHERE email = ? AND symbol = ?',
      [email, symbol]
    );
    // Always insert a new row, do not update/overwrite
    await executeQuery(
      'INSERT INTO user_investments (email, symbol, shares, invested_at, track_dividends) VALUES (?, ?, ?, ?, ?)',
      [email, symbol, shares, invested_at, track_dividends ? 1 : 0]
    );
    console.log(`[📝] Added new investment for ${email}: ${symbol}`);
    try {
      await executeQuery(
        'DELETE FROM user_investment_summaries WHERE email = ?',
        [email]
      );
      console.log(`[🗑️] Invalidated cached investment summary for ${email}`);
    } catch (err) {
      console.error(`[❌] Failed to invalidate investment summary cache: ${err.message}`);
    }
    res.status(200).json({ message: 'Investment saved successfully' });
  } catch (err) {
    console.error('[❌] addInvestment error:', err);
    res.status(500).json({ error: 'Failed to save investment' });
  }
};

// Fetch all investments (for admin or overview)
export const getAllInvestments = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM investments ORDER BY invested_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching investments:', err);
    res.status(500).json({ error: 'Failed to retrieve investments' });
  }
};
// Fetch all investments for a specific user by email and return calculated metrics and simulation results
export const getUserInvestments = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT CAST(shares AS DECIMAL(10,4)) AS shares,
              CAST(invested_at AS DATE) AS invested_at,
              symbol,
              track_dividends
       FROM user_investments
       WHERE email = ?
       ORDER BY invested_at DESC`,
      [email]
    );

    const results = [];
    for (const { symbol, shares, invested_at, track_dividends } of rows) {
      const date = invested_at.toISOString().slice(0, 10);
      const histPrice = await fetchHistoricalPrice(symbol, date);
      const usdInvested = parseFloat((shares * (histPrice || 0)).toFixed(2));

      // Invoke yieldCalc.js to compute portfolio metrics and auto-compounding forecast
      const scriptPath = new URL('../scripts/yieldCalc.js', import.meta.url).pathname;
      const execFileAsync = promisify(execFile);
      const args = ['--usd', usdInvested.toString(), symbol, date];
      if (track_dividends === 1 || track_dividends === true) {
        args.push('--track-dividends');
      }
      const { stdout, stderr } = await execFileAsync(
        'node',
        [scriptPath, ...args],
        { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }
      ).catch(err => {
        console.error('[getUserInvestments] yieldCalc execution error:', err);
        return { stdout: err.stdout || '', stderr: err.stderr || err.message };
      });
      if (stderr) console.error('[getUserInvestments] yieldCalc stderr:', stderr);

      const pvMatch = stdout.match(/Current portfolio value: \$([0-9.,]+)/);
      const profitMatch = stdout.match(/Price profit\/loss: \$([0-9.,]+) \(\$([0-9.,]+) per share\)/);
      const dividendMatch = stdout.match(/Projected Annual Dividend: \$([0-9.,]+) \(\$([0-9.,]+) per share\)/);

      const portfolioValue = pvMatch ? parseFloat(pvMatch[1].replace(/,/g, '')) : 0;
      const profitOrLossUsd = profitMatch ? parseFloat(profitMatch[1].replace(/,/g, '')) : 0;
      const profitOrLossPerShare = profitMatch ? parseFloat(profitMatch[2].replace(/,/g, '')) : 0;
      const annualDividendUsd = dividendMatch ? parseFloat(dividendMatch[1].replace(/,/g, '')) : 0;

      const simulation = stdout
        .split(/\r?\n/)
        .filter((l) => l.startsWith('Year '))
        .map((line) => {
          const m = line.match(/Year (\d+): Shares=([0-9.]+), Dividends=\$([0-9.,]+), Value=\$([0-9.,]+)/);
          if (!m) return null;
          return {
            year: parseInt(m[1], 10),
            shares: parseFloat(m[2]),
            dividends: parseFloat(m[3].replace(/,/g, '')),
            value: parseFloat(m[4].replace(/,/g, '')),
          };
        })
        .filter((r) => r);

      results.push({
        symbol,
        shares: parseFloat(shares),
        investedAt: date,
        usdInvested,
        portfolioValue,
        profitOrLossUsd,
        profitOrLossPerShare,
        annualDividendUsd,
        simulation,
      });
    }

    return res.json(results);
  } catch (err) {
    console.error('[getUserInvestments] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

export const getHistoricalPrice = async (req, res) => {
  const { symbol, date } = req.query;
  if (!symbol || !date) {
    return res.status(400).json({ error: 'Missing symbol or date parameter' });
  }
  try {
    const price = await fetchHistoricalPrice(symbol, date);
    if (price != null) {
      return res.json({ symbol, date, price });
    }
    return res.status(404).json({ error: `Price not found for ${symbol} on ${date}` });
  } catch (err) {
    console.error('[getHistoricalPrice] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const getYieldCalcSimulation = async (req, res) => {
  const { years, symbol, date } = req.query;
  if (!years || !symbol || !date) {
    return res.status(400).json({ error: 'Missing years, symbol, or date parameter' });
  }
  try {
    // Lookup the user's share count for this investment to seed auto-compounding
    const [shareRows] = await db.execute(
      `SELECT CAST(shares AS DECIMAL(10,4)) AS shares
       FROM user_investments
       WHERE email = ? AND symbol = ? AND CAST(invested_at AS DATE) = ?`,
      [req.user.email, symbol, date]
    );
    if (!shareRows.length) {
      return res.status(404).json({ error: 'No matching investment found for simulation' });
    }
    const shares = parseFloat(shareRows[0].shares);
    const [currentPrice, historicalPrice] = await Promise.all([
      fetchPriceFromFMP(symbol).then(p => p || fetchMSTRFromMarketWatch()),
      fetchHistoricalPrice(symbol, date),
    ]);
    if (!currentPrice || !historicalPrice) {
      console.error('[getYieldCalcSimulation] Failed to fetch price data for simulation', { currentPrice, historicalPrice });
      return res.status(500).json({ error: 'Failed to fetch price data for simulation' });
    }
    const simResults = simulateAutoCompounding(shares, dividendPerShare, currentPrice, parseInt(years, 10));
    const results = simResults.map(r => ({
      year: r.year,
      totalShares: parseFloat(r.totalShares),
      estimatedDividends: parseFloat(r.estimatedDividends),
      portfolioValue: parseFloat(r.portfolioValue),
    }));
    return res.json({ symbol, date, years: parseInt(years, 10), results });
  } catch (err) {
    console.error('[getYieldCalcSimulation] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
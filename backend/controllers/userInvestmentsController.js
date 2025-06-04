import axios from 'axios';
import { differenceInDays, format } from 'date-fns';
import { execFile } from 'child_process';
import { promisify } from 'util';
import mysql from 'mysql2/promise';
import { getInvestmentSummary, getPortfolioSimulation } from './investmentController.js';

const execFileAsync = promisify(execFile);

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'investment_tracker',
});

export const getUserInvestments = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         CAST(shares AS DECIMAL(10,4)) AS shares,
         CAST(invested_at AS DATE) AS invested_at,
         symbol,
         track_dividends,
         CAST(avg_dividend_per_share AS DECIMAL(10,4)) AS avg_dividend_per_share
       FROM user_investments
       WHERE email = ?
       ORDER BY invested_at DESC`,
      [email]
    );

    const results = [];
    for (const { symbol, shares, invested_at, track_dividends, avg_dividend_per_share } of rows) {
      const date = invested_at.toISOString().slice(0, 10);
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      const scriptPath = new URL('../scripts/yieldCalc.js', import.meta.url).pathname;

      let usdInvested = 0;
      try {
        const { stdout: priceOutInvested } = await execFileAsync(
          'node',
          [scriptPath, '--price-only', symbol, date],
          { timeout: 15000 }
        );
        const m2 = priceOutInvested.match(/closing price.*\$([0-9.,]+)/);
        if (m2) {
          const histPrice = parseFloat(m2[1].replace(/,/g, ''));
          usdInvested = parseFloat((shares * histPrice).toFixed(2));
        }
      } catch (e) {
        console.error('[getUserInvestments] Error fetching price for purchase USD value:', e);
      }

      // Calculate estimated total dividends using avg_dividend_per_share and distribution frequency
      const investedDate = new Date(invested_at);
      const daysHeld = differenceInDays(new Date(), investedDate);
      let dividendIntervalDays = 365;
      try {
        const [etfRows] = await db.execute(
          'SELECT distribution_frequency FROM high_yield_etfs WHERE ticker = ?',
          [symbol]
        );
        const freq = etfRows[0]?.distribution_frequency?.toLowerCase();
        switch (freq) {
          case 'monthly':
            dividendIntervalDays = 30;
            break;
          case 'quarterly':
            dividendIntervalDays = 91;
            break;
          case 'semi-annual':
          case 'semiannual':
            dividendIntervalDays = 182;
            break;
          case 'annual':
            dividendIntervalDays = 365;
            break;
        }
      } catch (e) {
        console.error('[getUserInvestments] Error fetching distribution_frequency for dividend estimate:', e);
      }
      const avgDividendPerShare = parseFloat(avg_dividend_per_share) || 0;
      const totalDividends = parseFloat(
        (shares * avgDividendPerShare * (daysHeld / dividendIntervalDays)).toFixed(2)
      );

      // Calculate current USD value via yieldCalc price-only mode
      let usdValue = 0;
      try {
        const { stdout: priceOutValue } = await execFileAsync(
          'node',
          [scriptPath, '--price-only', symbol, currentDate],
          { timeout: 15000 }
        );
        const priceMatchValue = priceOutValue.match(/closing price.*\$([0-9.,]+)/);
        if (priceMatchValue) {
          usdValue = parseFloat((shares * priceMatchValue[1].replace(/,/g, '')).toFixed(2));
        }
      } catch (e) {
        console.error('[getUserInvestments] Error fetching price for USD value:', e);
      }

      // Invoke yieldCalc.js to compute portfolio metrics and auto-compounding forecast
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
      const dividendMatch = stdout.match(/Projected Annual Dividend: \$([0-9.,]+) \(\$([0-9.,]+) per share\)/);

      const portfolioValue = pvMatch ? parseFloat(pvMatch[1].replace(/,/g, '')) : 0;
      const profitOrLossUsd = parseFloat((usdValue - usdInvested).toFixed(2));
      const profitOrLossPerShare = shares > 0
        ? parseFloat(((usdValue - usdInvested) / shares).toFixed(4))
        : 0;
      const annualDividendUsd = dividendMatch ? parseFloat(dividendMatch[1].replace(/,/g, '')) : 0;

      const simulation = stdout
        .split(/\r?\n/)
        .filter(l => l.startsWith('Year '))
        .map(line => {
          const m = line.match(/Year (\d+): Shares=([0-9.]+), Dividends=\$([0-9.,]+), Value=\$([0-9.,]+)/);
          if (!m) return null;
          return {
            year: parseInt(m[1], 10),
            shares: parseFloat(m[2]),
            dividends: parseFloat(m[3].replace(/,/g, '')),
            value: parseFloat(m[4].replace(/,/g, '')),
          };
        })
        .filter(r => r);

      results.push({
        symbol,
        shares: parseFloat(shares),
        investedAt: date,
        usdInvested,
        usdValue,
        portfolioValue,
        profitOrLossUsd,
        profitOrLossPerShare,
        annualDividendUsd,
        totalDividends,
        avg_dividend_per_share: parseFloat(avg_dividend_per_share),
        simulation,
        track_dividends,
      });
    }

    return res.json(results);
  } catch (err) {
    console.error('[getUserInvestments] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/investments/total_shares_by_symbol
 * Returns total shares grouped by symbol for the authenticated user.
 */
export const getTotalSharesBySymbol = async (req, res) => {
  const { email } = req.user;
  try {
    const [rows] = await db.execute(
      'SELECT symbol, CAST(SUM(shares) AS DECIMAL(10,4)) AS totalShares FROM user_investments WHERE email = ? GROUP BY symbol',
      [email]
    );
    return res.json(rows);
  } catch (err) {
    console.error('[getTotalSharesBySymbol] Error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/investments/total_dividends
 * Proxy to /summary for total historical dividends (uses summary cache).
 */
export const getTotalDividends = (req, res) => {
  req.query.skipCache = 'true';
  return getInvestmentSummary(req, res);
};

/**
 * GET /api/investments/avg_dividend_per_share
 * Proxy to /summary for average weekly dividend per share.
 */
export const getAvgDividendPerShare = (req, res) => {
  req.query.skipCache = 'true';
  return getInvestmentSummary(req, res);
};

/**
 * GET /api/investments/profit_loss
 * Proxy to /summary for profit or loss in USD.
 */
export const getProfitLoss = (req, res) => {
  req.query.skipCache = 'true';
  return getInvestmentSummary(req, res);
};

/**
 * GET /api/investments/profit_loss_per_share
 * Proxy to /summary for profit or loss per share.
 */
export const getProfitLossPerShare = (req, res) => {
  req.query.skipCache = 'true';
  return getInvestmentSummary(req, res);
};

/**
 * GET /api/investments/dividend_returns
 * Proxy to /summary for total dividends and per-share historical yield.
 */
export const getDividendReturns = (req, res) => {
  req.query.skipCache = 'true';
  return getInvestmentSummary(req, res);
};

/**
 * GET /api/investments/estimated_dividend_returns
 * Proxy to /portfolio_simulation for forecasted dividend returns.
 */
export const getEstimatedDividendReturns = (req, res) => {
  return getPortfolioSimulation(req, res);
};
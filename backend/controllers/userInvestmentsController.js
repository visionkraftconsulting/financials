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
         symbol,
         type,
         CAST(shares AS DECIMAL(10,4)) AS shares,
         CAST(invested_at AS DATE) AS invested_at,
         track_dividends,
         CAST(avg_dividend_per_share AS DECIMAL(10,4)) AS avg_dividend_per_share,
         usd_invested,
         usd_value,
         portfolio_value,
         profit_or_loss_usd,
         profit_or_loss_per_share,
         annual_dividend_usd,
         total_dividends,
         updated_at
       FROM user_investments
       WHERE email = ?
       ORDER BY invested_at DESC`,
      [email]
    );

    const results = rows.map(row => ({
      symbol: row.symbol,
      type: row.type,
      shares: parseFloat(row.shares),
      investedAt: row.invested_at.toISOString().slice(0, 10),
      track_dividends: row.track_dividends,
      avg_dividend_per_share: parseFloat(row.avg_dividend_per_share),
      usdInvested: parseFloat(row.usd_invested),
      usdValue: parseFloat(row.usd_value),
      portfolioValue: parseFloat(row.portfolio_value),
      profitOrLossUsd: parseFloat(row.profit_or_loss_usd),
      profitOrLossPerShare: parseFloat(row.profit_or_loss_per_share),
      annualDividendUsd: parseFloat(row.annual_dividend_usd),
      totalDividends: parseFloat(row.total_dividends),
      updated_at: row.updated_at.toISOString(),
    }));

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
/**
 * POST /api/investments/recalculate_user_investments
 * Trigger background recalculation of cached metrics for user investments.
 */
export const recalcUserInvestments = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }

  (async () => {
    try {
      const [investments] = await db.execute(
        `SELECT symbol, CAST(shares AS DECIMAL(10,4)) AS shares, CAST(invested_at AS DATE) AS invested_at, track_dividends, avg_dividend_per_share
         FROM user_investments
         WHERE email = ?`,
        [email]
      );

      const scriptPath = new URL('../scripts/yieldCalc.js', import.meta.url).pathname;
      for (const inv of investments) {
        const date = inv.invested_at.toISOString().slice(0, 10);
        let usdInvested = 0;
        try {
          const { stdout } = await execFileAsync(
            'node',
            [scriptPath, '--price-only', inv.symbol, date],
            { timeout: 15000 }
          );
          const m = stdout.match(/closing price.*\$([0-9.,]+)/);
          if (m) {
            usdInvested = parseFloat(m[1].replace(/,/g, '')) * inv.shares;
          }
        } catch (e) {
          console.error('[recalcUserInvestments] usdInvested error:', e);
        }

        let usdValue = 0;
        try {
          const { stdout } = await execFileAsync(
            'node',
            [scriptPath, '--price-only', inv.symbol, format(new Date(), 'yyyy-MM-dd')],
            { timeout: 15000 }
          );
          const m = stdout.match(/closing price.*\$([0-9.,]+)/);
          if (m) {
            usdValue = parseFloat(m[1].replace(/,/g, '')) * inv.shares;
          }
        } catch (e) {
          console.error('[recalcUserInvestments] usdValue error:', e);
        }

        const daysHeld = differenceInDays(new Date(), new Date(inv.invested_at));
        let dividendIntervalDays = 365;
        try {
          const [etfRows] = await db.execute(
            'SELECT distribution_frequency FROM high_yield_etfs WHERE ticker = ?',
            [inv.symbol]
          );
          const freq = etfRows[0]?.distribution_frequency?.toLowerCase();
          if (freq === 'monthly') dividendIntervalDays = 30;
          else if (freq === 'quarterly') dividendIntervalDays = 91;
          else if (freq === 'semi-annual' || freq === 'semiannual') dividendIntervalDays = 182;
          else if (freq === 'annual') dividendIntervalDays = 365;
        } catch (e) {
          console.error('[recalcUserInvestments] distribution_frequency error:', e);
        }

        const totalDividends = parseFloat(
          (inv.shares * inv.avg_dividend_per_share * (daysHeld / dividendIntervalDays)).toFixed(2)
        );

        let portfolioValue = 0;
        try {
        const { stdout } = await execFileAsync(
            'node',
            [scriptPath, '--usd', usdInvested.toFixed(2), inv.symbol, date].concat(inv.track_dividends ? ['--track-dividends'] : []),
            { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }
          );
          const m = stdout.match(/Current portfolio value: \$([0-9.,]+)/);
          portfolioValue = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
        } catch (e) {
          console.error('[recalcUserInvestments] portfolioValue error:', e);
        }

        const profitOrLossUsd = parseFloat((usdValue - usdInvested).toFixed(2));
        const profitOrLossPerShare = inv.shares > 0
          ? parseFloat(((usdValue - usdInvested) / inv.shares).toFixed(4))
          : 0;
        let annualDividendUsd = 0;
        try {
        const { stdout } = await execFileAsync(
            'node',
            [scriptPath, '--usd', usdInvested.toFixed(2), inv.symbol, date].concat(inv.track_dividends ? ['--track-dividends'] : []),
            { timeout: 15000, maxBuffer: 10 * 1024 * 1024 }
          );
          const m = stdout.match(/Projected Annual Dividend: \$([0-9.,]+)/);
          annualDividendUsd = m ? parseFloat(m[1].replace(/,/g, '')) : 0;
        } catch (e) {
          console.error('[recalcUserInvestments] annualDividendUsd error:', e);
        }

        try {
          await db.execute(
            `UPDATE user_investments
             SET usd_invested = ?, usd_value = ?, portfolio_value = ?, profit_or_loss_usd = ?, profit_or_loss_per_share = ?, annual_dividend_usd = ?, total_dividends = ?
             WHERE email = ? AND symbol = ? AND invested_at = ?`,
            [usdInvested, usdValue, portfolioValue, profitOrLossUsd, profitOrLossPerShare, annualDividendUsd, totalDividends, email, inv.symbol, date]
          );
        } catch (e) {
          console.error('[recalcUserInvestments] update error:', e);
        }
      }
    } catch (err) {
      console.error('[recalcUserInvestments] error scheduling recalc:', err);
    }
  })();

  res.status(202).json({ status: 'recalculation scheduled' });
};

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
import db from '../utils/db.js';
import axios from 'axios';
const TWELVE_DATA_API_URL = 'https://api.twelvedata.com';

/**
 * GET /api/investments/user_crypto_investments
 * Returns list of user's crypto investments with computed P/L
 */
export const getUserCryptoInvestments = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT symbol,
              CAST(amount AS DECIMAL(30,8)) AS amount,
              CAST(invested_at AS DATE) AS invested_at,
              CAST(usd_invested AS DECIMAL(20,2)) AS usd_invested,
              CAST(usd_value AS DECIMAL(20,2)) AS usd_value,
              CAST(profit_or_loss_usd AS DECIMAL(20,2)) AS profit_or_loss_usd,
              CAST(profit_or_loss_per_unit AS DECIMAL(20,8)) AS profit_or_loss_per_unit,
              updated_at
       FROM user_crypto_investments
       WHERE email = ?
       ORDER BY invested_at DESC`,
      [email]
    );
    const results = rows.map(row => ({
      symbol: row.symbol,
      amount: parseFloat(row.amount),
      investedAt: row.invested_at.toISOString().slice(0, 10),
      usdInvested: parseFloat(row.usd_invested),
      usdValue: parseFloat(row.usd_value),
      profitOrLossUsd: parseFloat(row.profit_or_loss_usd),
      profitOrLossPerUnit: parseFloat(row.profit_or_loss_per_unit),
      updated_at: row.updated_at.toISOString()
    }));
    return res.json(results);
  } catch (err) {
    console.error('[getUserCryptoInvestments] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch user crypto investments' });
  }
};

/**
 * POST /api/investments/crypto
 * Add a new crypto investment for authenticated user
 */
export const addCryptoInvestment = async (req, res) => {
  const { email } = req.user;
  const { symbol, amount, invested_at } = req.body;
  if (!symbol || amount == null || !invested_at) {
    return res.status(400).json({ error: 'symbol, amount and invested_at are required' });
  }
  try {
    await db.execute(
      'INSERT INTO user_crypto_investments (email, symbol, amount, invested_at) VALUES (?, ?, ?, ?)',
      [email, symbol, amount, invested_at]
    );
    return res.status(200).json({ message: 'Crypto investment saved successfully' });
  } catch (err) {
    console.error('[addCryptoInvestment] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save crypto investment' });
  }
};

/**
 * POST /api/investments/recalculate_user_crypto_investments
 * Trigger background recalculation of crypto investment metrics
 */
export const recalcUserCryptoInvestments = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email parameter' });
  }
  (async () => {
    try {
      const [investments] = await db.execute(
        `SELECT symbol,
                CAST(amount AS DECIMAL(30,8)) AS amount,
                CAST(invested_at AS DATE) AS invested_at
         FROM user_crypto_investments
         WHERE email = ?`,
        [email]
      );
      for (const inv of investments) {
        const date = inv.invested_at.toISOString().slice(0, 10);
        let historicalPrice = null;
        try {
          historicalPrice = await fetchHistoricalCryptoPrice(inv.symbol, date);
        } catch (e) {
          console.error('[recalcUserCrypto] historicalPrice error:', e.message);
        }
        let currentPrice = null;
        try {
          currentPrice = await fetchCurrentCryptoPrice(inv.symbol);
        } catch (e) {
          console.error('[recalcUserCrypto] currentPrice error:', e.message);
        }
        const usdInvested = historicalPrice != null ? historicalPrice * inv.amount : 0;
        const usdValue = currentPrice != null ? currentPrice * inv.amount : 0;
        const profitOrLossUsd = parseFloat((usdValue - usdInvested).toFixed(2));
        const profitOrLossPerUnit = historicalPrice != null && currentPrice != null
          ? parseFloat((currentPrice - historicalPrice).toFixed(8))
          : 0;
        await db.execute(
          `UPDATE user_crypto_investments
           SET usd_invested = ?,
               usd_value = ?,
               profit_or_loss_usd = ?,
               profit_or_loss_per_unit = ?
           WHERE email = ? AND symbol = ? AND invested_at = ?`,
          [usdInvested, usdValue, profitOrLossUsd, profitOrLossPerUnit, email, inv.symbol, date]
        );
      }
    } catch (err) {
      console.error('[recalcUserCrypto] Error scheduling recalc:', err.message);
    }
  })();
  return res.status(202).json({ status: 'recalculation scheduled' });
};

/**
 * Helper: fetch historical crypto price via Twelve Data time_series API
 */
async function fetchHistoricalCryptoPrice(symbol, date) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Twelve Data API key');
  }
  const resp = await axios.get(
    `${TWELVE_DATA_API_URL}/time_series`,
    {
      params: {
        symbol: `${symbol}/USD`,
        apikey: apiKey,
        interval: '1day',
        start_date: date,
        end_date: date
      }
    }
  );
  const values = resp.data?.values;
  return values && values.length > 0 ? parseFloat(values[0].close) : null;
}

/**
 * Helper: fetch current crypto price via Twelve Data quote API
 */
async function fetchCurrentCryptoPrice(symbol) {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Twelve Data API key');
  }
  const resp = await axios.get(
    `${TWELVE_DATA_API_URL}/quote`,
    {
      params: {
        symbol: `${symbol}/USD`,
        apikey: apiKey
      }
    }
  );
  return resp.data?.close != null ? parseFloat(resp.data.close) : null;
}
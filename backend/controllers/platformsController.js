import fetch from 'node-fetch';
import { getAccessToken } from '../services/tokenService.js';
import { executeQuery } from '../utils/db.js';

/**
 * Fetch user's Charles Schwab investments via OAuth2, upsert into DB, and return holdings with P/L.
 */
export async function fetchSchwabInvestments(req, res) {
  const userEmail = req.user.email;
  try {
    const accessToken = await getAccessToken();
    const accountId = process.env.SCHWAB_ACCOUNT_ID;
    const baseUrl = process.env.SCHWAB_API_BASE_URL || 'https://api.schwab.com';
    const url = `${baseUrl}/accounts/${accountId}/positions`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Schwab API error (${response.status}): ${text}`);
    }
    const data = await response.json();
    const holdings = data.positions || data.holdings || [];
    const values = [];
    for (const h of holdings) {
      const symbol = h.instrument?.symbol;
      const shares = Number(h.quantity) || 0;
      const costBasis = Number(h.averageCost) || 0;
      const costBasisUsd = costBasis * shares;
      const currentPrice = Number(h.lastPrice) || 0;
      const currentValueUsd = currentPrice * shares;
      const profitLossUsd = currentValueUsd - costBasisUsd;
      values.push([
        userEmail,
        'schwab',
        symbol,
        shares,
        costBasisUsd,
        currentPrice,
        currentValueUsd,
        profitLossUsd
      ]);
    }
    if (values.length) {
      const sql = `
        INSERT INTO platform_investments
          (email, platform, symbol, shares, cost_basis_usd, current_price_usd, current_value_usd, profit_loss_usd)
        VALUES ?
        ON DUPLICATE KEY UPDATE
          shares = VALUES(shares),
          cost_basis_usd = VALUES(cost_basis_usd),
          current_price_usd = VALUES(current_price_usd),
          current_value_usd = VALUES(current_value_usd),
          profit_loss_usd = VALUES(profit_loss_usd),
          updated_at = CURRENT_TIMESTAMP
      `;
      await executeQuery(sql, [values]);
    }
    const investments = values.map(([, , symbol, shares, costBasisUsd, currentPriceUsd, currentValueUsd, profitLossUsd]) => ({
      symbol,
      shares,
      costBasisUsd,
      currentPriceUsd,
      currentValueUsd,
      profitLossUsd
    }));
    res.json({ investments });
  } catch (err) {
    console.error('[platformsController.fetchSchwabInvestments] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch Schwab investments' });
  }
}
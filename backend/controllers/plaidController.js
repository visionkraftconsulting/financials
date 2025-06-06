import dotenv from 'dotenv';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { saveAccessToken, getAccessToken } from '../services/plaidService.js';

dotenv.config();

// Initialize Plaid client configuration
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    }
  }
});
const plaidClient = new PlaidApi(config);

/**
 * Create a Plaid Link token
 */
export async function createLinkToken(req, res) {
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: req.user.id.toString() },
      client_name: process.env.PLAID_CLIENT_NAME || 'Investment Tracker',
      products: ['investments', 'transactions'],
      country_codes: ['US'],
      language: 'en'
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('[Plaid] createLinkToken error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Exchange public_token for access_token and store it
 */
export async function exchangePublicToken(req, res) {
  const { public_token } = req.body;
  if (!public_token) {
    return res.status(400).json({ error: 'public_token is required' });
  }
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;
    await saveAccessToken(req.user.id, accessToken);
    res.json({ message: 'Access token saved.' });
  } catch (error) {
    console.error('[Plaid] exchangePublicToken error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieve basic account information
 */
export async function getAccounts(req, res) {
  try {
    const accessToken = await getAccessToken(req.user.id);
    const accountsResponse = await plaidClient.accountsGet({ access_token: accessToken });
    res.json(accountsResponse.data.accounts);
  } catch (error) {
    console.error('[Plaid] getAccounts error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieve investment holdings
 */
export async function getHoldings(req, res) {
  try {
    const accessToken = await getAccessToken(req.user.id);
    const holdingsResponse = await plaidClient.investmentsHoldingsGet({ access_token: accessToken });
    res.json(holdingsResponse.data);
  } catch (error) {
    console.error('[Plaid] getHoldings error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieve transactions (default last 30 days)
 */
export async function getTransactions(req, res) {
  try {
    const accessToken = await getAccessToken(req.user.id);
    const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 500, offset: 0 }
    });
    res.json(transactionsResponse.data);
  } catch (error) {
    console.error('[Plaid] getTransactions error:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieve account balances
 */
export async function getBalance(req, res) {
  try {
    const accessToken = await getAccessToken(req.user.id);
    const balanceResponse = await plaidClient.accountsBalanceGet({ access_token: accessToken });
    res.json(balanceResponse.data.accounts);
  } catch (error) {
    console.error('[Plaid] getBalance error:', error);
    res.status(500).json({ error: error.message });
  }
}
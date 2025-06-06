import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  getHoldings,
  getTransactions,
  getBalance
} from '../controllers/plaidController.js';

const router = express.Router();

// Create a Plaid Link token for initializing Plaid Link on the client
router.post('/create-link-token', authenticate, createLinkToken);

// Exchange the Plaid public_token for an access_token
router.post('/exchange-public-token', authenticate, exchangePublicToken);

// Retrieve basic account information
router.get('/accounts', authenticate, getAccounts);

// Retrieve investment holdings data
router.get('/holdings', authenticate, getHoldings);

// Retrieve transactions (defaults to last 30 days)
router.get('/transactions', authenticate, getTransactions);

// Retrieve account balances
router.get('/balance', authenticate, getBalance);

export default router;
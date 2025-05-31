import express from 'express';
import {
  getUserWallets,
  addWallet,
  updateWalletNickname
} from '../controllers/walletController.js';

const router = express.Router();

// Retrieve all wallets for authenticated user
router.get('/', getUserWallets);

// Add a new wallet (manual entry or dynamic connect)
router.post('/', addWallet);

// Update wallet nickname by ID and chain
router.put('/:id', updateWalletNickname);

export default router;
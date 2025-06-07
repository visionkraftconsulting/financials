import express from 'express';
import {
  getUserCryptoInvestments,
  addCryptoInvestment,
  recalcUserCryptoInvestments,
  updateCryptoInvestment,
  deleteCryptoInvestment
} from '../controllers/cryptoInvestmentsController.js';

const router = express.Router();

// Get user's crypto investments
router.get('/user_crypto_investments', getUserCryptoInvestments);

// Add a new crypto investment
router.post('/crypto', addCryptoInvestment);

// Trigger background recalculation of crypto metrics
router.post('/recalculate_user_crypto_investments', recalcUserCryptoInvestments);
// Update a user crypto investment
router.put('/user_crypto_investments/:symbol/:invested_at', updateCryptoInvestment);
// Delete a user crypto investment
router.delete('/user_crypto_investments/:symbol/:invested_at', deleteCryptoInvestment);

export default router;
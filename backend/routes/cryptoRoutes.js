import express from 'express';
import { getTopCryptos, getSuggestedCryptos, getSgaPicks } from '../controllers/cryptoController.js';

const router = express.Router();

// Route to fetch top 100 cryptocurrencies by market cap
router.get('/top-cryptos', getTopCryptos);

// Route to fetch suggested (trending) cryptocurrencies
router.get('/suggested-cryptos', getSuggestedCryptos);

// Route to fetch SGA Premium Picks via custom Token Metrics API
router.get('/sga-picks', getSgaPicks);

export default router;
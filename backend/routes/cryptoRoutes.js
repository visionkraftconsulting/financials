import express from 'express';
import { getTopCryptos, getSuggestedCryptos, getSgaPicks, getStoredSgaPicks, getEnrichedSgaPicks } from '../controllers/cryptoController.js';

const router = express.Router();

// Route to fetch top 100 cryptocurrencies by market cap
router.get('/top-cryptos', getTopCryptos);

// Route to fetch suggested (trending) cryptocurrencies
router.get('/suggested-cryptos', getSuggestedCryptos);

// Route to fetch SGA Premium Picks via custom Token Metrics API
router.get('/sga-picks', getSgaPicks);

router.get('/sga-picks/stored', getStoredSgaPicks);

// Route to fetch enriched SGA picks with CoinGecko details
router.get('/sga-picks/enriched', getEnrichedSgaPicks);

export default router;
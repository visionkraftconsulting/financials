import express from 'express';
import { getTopCryptos, getSuggestedCryptos, getSgaPicks, getStoredSgaPicks, getEnrichedSgaPicks } from '../controllers/cryptoController.js';

const router = express.Router();

// Route to fetch top 100 cryptocurrencies by market cap
router.get('/top-cryptos', getTopCryptos);

// Route to fetch cached top 100 cryptocurrencies from DB
router.get('/top-cryptos/cached', async (req, res) => {
  try {
    const db = (await import('../utils/db.js')).default;
    const [rows] = await db.query(
      'SELECT * FROM top_cryptos ORDER BY market_cap_rank ASC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to fetch cached top cryptos:', err.message);
    res.status(500).json({ error: 'Failed to fetch cached top cryptos' });
  }
});

// Route to fetch suggested (trending) cryptocurrencies
router.get('/suggested-cryptos', getSuggestedCryptos);

// Route to fetch SGA Premium Picks via custom Token Metrics API
router.get('/sga-picks', getSgaPicks);

router.get('/sga-picks/stored', getStoredSgaPicks);

// Route to fetch enriched SGA picks with CoinGecko details
router.get('/sga-picks/enriched', getEnrichedSgaPicks);

// Route to trigger periodic trending crypto update manually
router.get('/update-trending-cryptos', async (req, res) => {
  try {
    const { getSuggestedCryptos } = await import('../controllers/cryptoController.js');
    await getSuggestedCryptos(req, res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger trending crypto update' });
  }
});

export default router;
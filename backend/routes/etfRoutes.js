import express from 'express';
import { getHighYieldEtfs, getCachedHighYieldEtfs, runFmpUpdate } from '../controllers/etfController.js';

const router = express.Router();

// Route to fetch cached high-yield ETFs from DB (uses cached data, falls back to manual fetch if empty)
router.get('/cached-high-yield-etfs', getCachedHighYieldEtfs);
// Route to fetch high-yield options strategy ETFs with yields >20%
router.get('/high-yield-etfs', getHighYieldEtfs);

// Manual trigger for OpenAI-based ETF enrichment
//router.post('/run-openai', runOpenAIUpdate);

// Manual trigger for FMP-based ETF update (bulk update or by ticker)
router.post('/run-fmp', runFmpUpdate);

export default router;

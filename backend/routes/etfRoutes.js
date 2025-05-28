import express from 'express';
import { getHighYieldEtfs, runOpenAIUpdate } from '../controllers/etfController.js';

const router = express.Router();

// Route to fetch high-yield options strategy ETFs with yields >20%
router.get('/high-yield-etfs', getHighYieldEtfs);

// Manual trigger for OpenAI-based ETF enrichment
router.post('/run-openai', runOpenAIUpdate);

export default router;

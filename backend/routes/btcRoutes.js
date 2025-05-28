import express from 'express';
import { getBtcSummary, updateWalletNickname } from '../controllers/btcController.js';
import { getBitcoinTreasuries, runOpenAIUpdate, runManualScrape } from '../controllers/btcTreasuries.js';

const router = express.Router();

router.get('/summary', getBtcSummary);
router.post('/update-nickname', updateWalletNickname);
router.get('/bitcoin-treasuries', getBitcoinTreasuries);
router.post('/bitcoin-treasuries/run-openai', runOpenAIUpdate);
router.post('/bitcoin-treasuries/manual-scrape', runManualScrape);

export default router;
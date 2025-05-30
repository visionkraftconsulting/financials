import express from 'express';
import { getBtcSummary, updateWalletNickname } from '../controllers/btcController.js';
import { getBitcoinTreasuries, runOpenAIUpdate, runManualScrape } from '../controllers/btcTreasuries.js';
import { getTreasuryCountries, getTreasuryCountryBreakdown } from '../controllers/btcCountriesController.js';
import { getBitcoinTreasuryEtfs } from '../controllers/btcEtfsController.js';

const router = express.Router();

router.get('/summary', getBtcSummary);
router.post('/update-nickname', updateWalletNickname);
router.get('/bitcoin-treasuries', getBitcoinTreasuries);
router.post('/bitcoin-treasuries/run-openai', runOpenAIUpdate);
router.post('/bitcoin-treasuries/manual-scrape', runManualScrape);
router.get('/bitcoin-treasuries/etfs', getBitcoinTreasuryEtfs);
router.get('/bitcoin-treasuries/countries', getTreasuryCountries);
router.get('/bitcoin-treasuries/country-breakdown', getTreasuryCountryBreakdown);

export default router;
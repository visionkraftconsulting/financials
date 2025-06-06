import express from 'express';
import { fetchSchwabInvestments } from '../controllers/platformsController.js';

const router = express.Router();

// Trigger fetching Schwab holdings, store in DB, and return with profit/loss data
router.get('/schwab/investments', fetchSchwabInvestments);

export default router;
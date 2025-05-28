import express from 'express';
import { getInvestmentSummary } from '../controllers/investmentController.js';

const router = express.Router();
router.get('/summary', getInvestmentSummary);

export default router;

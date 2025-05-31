import express from 'express';
import { getInvestmentSummary, addInvestment } from '../controllers/investmentController.js';

const router = express.Router();
router.get('/summary', getInvestmentSummary);
router.post('/', addInvestment);

export default router;

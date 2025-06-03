import express from 'express';
import { getInvestmentSummary, addInvestment, getUserInvestments,
         getHistoricalPrice, getYieldCalcSimulation } from '../controllers/investmentController.js';

const router = express.Router();
router.get('/summary', getInvestmentSummary);
router.get('/price', getHistoricalPrice);
router.get('/simulation', getYieldCalcSimulation);

router.post('/', addInvestment);
router.get('/user_investments', getUserInvestments);

export default router;

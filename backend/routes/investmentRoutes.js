import express from 'express';
import { getInvestmentSummary, addInvestment, getUserInvestments } from '../controllers/investmentController.js';

const router = express.Router();
router.get('/summary', getInvestmentSummary);

router.post('/', addInvestment);
router.get('/user_investments', getUserInvestments);

export default router;

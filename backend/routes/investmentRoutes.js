import express from 'express';
import { getInvestmentSummary, addInvestment,
         getHistoricalPrice, getYieldCalcSimulation, getPortfolioSimulation
} from '../controllers/investmentController.js';
import {
  getUserInvestments,
  recalcUserInvestments,
  getTotalSharesBySymbol,
  getProfitLoss,
  getProfitLossPerShare,
  getDividendReturns,
  getEstimatedDividendReturns
} from '../controllers/userInvestmentsController.js';

const router = express.Router();
router.get('/summary', getInvestmentSummary);
router.get('/price', getHistoricalPrice);
router.get('/simulation', getYieldCalcSimulation);
// Portfolio-wide auto-compounding simulation across all user investments
router.get('/portfolio_simulation', getPortfolioSimulation);

// Individual metric endpoints for stat cards (FaExchangeAlt boxes)
router.get('/total_shares_by_symbol', getTotalSharesBySymbol);
router.get('/profit_loss', getProfitLoss);
router.get('/profit_loss_per_share', getProfitLossPerShare);
router.get('/dividend_returns', getDividendReturns);
router.get('/estimated_dividend_returns', getEstimatedDividendReturns);

router.post('/', addInvestment);
router.get('/user_investments', getUserInvestments);
router.post('/recalculate_user_investments', recalcUserInvestments);

export default router;

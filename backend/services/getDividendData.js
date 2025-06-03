import dotenv from 'dotenv';
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });
// updateEtfDividends.js
import { getDividendData } from './services/getDividendData.js';

const tickers = ['ABNY', 'AIYY', 'AMDY', 'AMZY', 'APLY', 'BABO', 'BIGY', 'CHPY'];

const results = [];

for (const ticker of tickers) {
  const data = await getDividendData(ticker);
  results.push({ ticker, ...data });
}

console.table(results.map(item => ({
  Ticker: item.ticker,
  'Dividend/Share': item.dividend,
  Yield: item.yield,
  'Ex-Date': item.exDate,
})));

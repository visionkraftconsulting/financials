import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
console.log('[Debug] Loaded FMP_API_KEY:', process.env.FMP_API_KEY);
import axios from 'axios';
import * as cheerio from 'cheerio';
import yahooFinance from 'yahoo-finance2';

// === CONFIGURATION ===
const initialInvestmentUSD = 75000;
const dividendPerShare = 1.4; // Last paid dividend
// Usage: node yieldCalc.js [years] [symbol]
// Default simulation years and override via CLI argument: node yieldCalc.js [years] [symbol]
const DEFAULT_YEARS_TO_SIMULATE = 10;
const yearsToSimulate = parseInt(process.argv[2], 10) || DEFAULT_YEARS_TO_SIMULATE;
const fmpApiKey = process.env.FMP_API_KEY;

// === Financial Modeling Prep price fetch (generic symbol) ===
async function fetchPriceFromFMP(symbol) {
  try {
    console.log(`[FMP] Sending request to Financial Modeling Prep API (quote-short) for ${symbol}...`);
    const res = await axios.get(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${fmpApiKey}`);
    console.log('[FMP] Response received:', res.data);
    if (res.data && res.data[0] && res.data[0].price) {
      console.log(`[FMP] Current ${symbol} price extracted: ${res.data[0].price}`);
      return res.data[0].price;
    }
    throw new Error('Invalid FMP response');
  } catch (err) {
    console.warn(`[FMP] Failed to fetch price for ${symbol}`, err.message);
    return null;
  }
}

// New function to fetch historical price using Yahoo Finance (via chart)
async function fetchHistoricalPrice(symbol, date) {
  try {
    console.log(`[Yahoo] Fetching historical price for ${symbol} on ${date}...`);
    const targetTime = new Date(date).getTime();
    const period1 = Math.floor(targetTime / 1000) - (5 * 86400); // 5 days before
    const period2 = Math.floor(targetTime / 1000) + (1 * 86400); // 1 day after

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval: '1d',
    });

    const prices = result?.quotes || [];
    const closest = prices
      .filter(p => p.close !== undefined)
      .sort((a, b) => {
        const aTime = new Date(a.date || a.timestamp).getTime();
        const bTime = new Date(b.date || b.timestamp).getTime();
        return Math.abs(aTime - targetTime) - Math.abs(bTime - targetTime);
      })[0];

    if (closest) {
      const closestDate = new Date(closest.date || closest.timestamp).toISOString().slice(0, 10);
      console.log(`[Yahoo] Nearest available close price on ${closestDate}: $${closest.close}`);
      return closest.close;
    }

    throw new Error('No historical data found in range');
  } catch (err) {
    console.warn(`[Yahoo] Failed to fetch historical price for ${symbol} on ${date}`, err.message);
    return null;
  }
}

// === MarketWatch fallback ===
async function fetchMSTRFromMarketWatch() {
  try {
    console.log('[MarketWatch] Fetching MarketWatch page...');
    const res = await axios.get('https://www.marketwatch.com/investing/stock/mstr');
    const $ = cheerio.load(res.data);
    const priceText = $('bg-quote.value').first().text().replace(/[^0-9.]/g, '');
    console.log(`[MarketWatch] Raw extracted price text: "${$('bg-quote.value').first().text()}"`);
    console.log(`[MarketWatch] Cleaned price text: "${priceText}"`);
    const price = parseFloat(priceText);
    console.log(`[MarketWatch] Parsed price: ${price}`);
    return isNaN(price) ? null : price;
  } catch (err) {
    console.error('[MarketWatch] Failed to fetch price', err.message);
    return null;
  }
}

// === Core Calculation ===
function simulateAutoCompounding(initialShares, dividendPerShare, currentPrice, years) {
  const results = [];
  let shares = initialShares;

  console.log(`[Simulation] Starting auto-compounding simulation for ${years} years.`);
  for (let year = 1; year <= years; year++) {
    const annualDividend = shares * dividendPerShare * 4; // Quarterly dividends
    const additionalShares = annualDividend / currentPrice;
    const startShares = shares;
    shares += additionalShares;

    console.log(`[Simulation] Year ${year}:`);
    console.log(`  Shares at start: ${startShares.toFixed(4)}`);
    console.log(`  Annual dividend: ${annualDividend.toFixed(2)}`);
    console.log(`  Additional shares bought: ${additionalShares.toFixed(4)}`);
    console.log(`  Shares at end: ${shares.toFixed(4)}`);
    console.log(`  Portfolio value: ${(shares * currentPrice).toFixed(2)}`);

    results.push({
      year,
      totalShares: shares.toFixed(4),
      estimatedDividends: annualDividend.toFixed(2),
      portfolioValue: (shares * currentPrice).toFixed(2),
    });
  }

  return results;
}

// === Main Execution ===
async function main() {
  const args = process.argv.slice(2);
  const priceOnlyMode = args.includes('--price-only');
  const symbolArgIndex = args.findIndex(arg => /^[A-Z]+$/.test(arg));
  const symbol = symbolArgIndex !== -1 ? args[symbolArgIndex] : 'MSTY';
  const purchaseDate = symbolArgIndex !== -1 ? args[symbolArgIndex + 1] : undefined; // date comes after symbol

  const usdMode = args.includes('--usd');
  const sharesMode = args.includes('--shares');
  const amountIndex = usdMode ? args.indexOf('--usd') + 1 : sharesMode ? args.indexOf('--shares') + 1 : -1;
  const inputAmount = amountIndex !== -1 ? parseFloat(args[amountIndex]) : null;

  if (priceOnlyMode) {
    if (!symbol || !purchaseDate) {
      console.error('[Usage] node yieldCalc.js --price-only <TICKER> <YYYY-MM-DD>');
      return;
    }
    const historicalPrice = await fetchHistoricalPrice(symbol, purchaseDate);
    if (historicalPrice) {
      console.log(`\n📅 ${symbol} closing price on ${purchaseDate}: $${historicalPrice.toFixed(2)}`);
    } else {
      console.error(`[Error] Could not retrieve price for ${symbol} on ${purchaseDate}`);
    }
    return;
  }

  if ((!usdMode && !sharesMode) || !inputAmount || !purchaseDate) {
    console.error('[Usage] node yieldCalc.js --usd <amount> --shares <amount> <TICKER> <YYYY-MM-DD>');
    return;
  }

  console.log(`[Main] Fetching current and historical prices for ${symbol}...`);
  const [currentPrice, historicalPrice] = await Promise.all([
    fetchPriceFromFMP(symbol).then(p => p || fetchMSTRFromMarketWatch()),
    fetchHistoricalPrice(symbol, purchaseDate),
  ]);

  if (!currentPrice || !historicalPrice) {
    console.error(`[Main] Failed to fetch required price data for ${symbol}.`);
    return;
  }

  console.log(`\n📅 Purchase Date Price (${purchaseDate}): $${historicalPrice.toFixed(2)}`);
  console.log(`✅ Current ${symbol} Price: $${currentPrice.toFixed(2)}`);

  const sharesOwned = usdMode ? inputAmount / historicalPrice : inputAmount;
  console.log(`[Main] Shares owned (${usdMode ? `$${inputAmount}` : `${sharesOwned} shares`}): ${sharesOwned.toFixed(4)}`);

  const currentValue = sharesOwned * currentPrice;
  const originalValue = sharesOwned * historicalPrice;
  const profit = currentValue - originalValue;
  const profitPerShare = currentPrice - historicalPrice;

  console.log(`[Main] Current portfolio value: $${currentValue.toFixed(2)}`);
  console.log(`[Main] Purchase value: $${originalValue.toFixed(2)}`);
  console.log(`[Main] Price profit/loss: $${profit.toFixed(2)} ($${profitPerShare.toFixed(2)} per share)`);

  const annualDividendsPerShare = dividendPerShare * 4;
  const totalDividends = annualDividendsPerShare * sharesOwned;
  console.log(`[Main] Projected Annual Dividend: $${totalDividends.toFixed(2)} ($${annualDividendsPerShare.toFixed(2)} per share)`);

  console.log('\n📅 Auto-Compounding Forecast:');
  const compoundingResults = simulateAutoCompounding(sharesOwned, dividendPerShare, currentPrice, yearsToSimulate);
  compoundingResults.forEach(res => {
    console.log(`Year ${res.year}: Shares=${res.totalShares}, Dividends=$${res.estimatedDividends}, Value=$${res.portfolioValue}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('yieldCalc.js')) {
  main()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[Main] Error running simulation:', err);
      process.exit(1);
    });
}

export { fetchHistoricalPrice, simulateAutoCompounding, fetchPriceFromFMP, fetchMSTRFromMarketWatch, dividendPerShare };

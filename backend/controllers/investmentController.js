import axios from 'axios';
import { differenceInWeeks, format } from 'date-fns';
import { calculateCompoundedDividends } from '../utils/compoundCalculator.js';
import { executeQuery } from '../utils/db.js';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

export const getInvestmentSummary = async (req, res) => {
  let { email } = req.query;
  if (!email) {
    email = 'kwasi@visionkraftconsulting.com'; // default for testing
  }
  console.log(`[📩] Using email: ${email}`);

  const symbol = 'MSTY';
  let initialShares = 6;
  let investedAt = new Date();
  let weeksElapsed = 12;
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  const cachePath = path.resolve('dividends-cache.json');

  // Retry helper for API calls
  const retry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        console.log(`[🔄] Retry ${i + 1}/${retries} after ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  try {
    // Database query
    const query = 'SELECT CAST(shares AS DECIMAL(10,4)) AS shares, CAST(invested_at AS DATETIME) AS invested_at FROM user_investments WHERE email = ?';
    console.log(`[📥] Executing query: "${query}" with [${email}]`);
    const rows = await executeQuery(query, [email]);

    if (rows.length === 0) {
      console.warn(`[⚠️] No investment record found for email: ${email}. Using defaults.`);
    } else {
      const { shares, invested_at } = rows[0];
      initialShares = shares;
      if (!invested_at) {
        investedAt = new Date();
        await executeQuery('UPDATE user_investments SET invested_at = ? WHERE email = ?', [investedAt.toISOString().split('T')[0], email]);
        console.log(`[📝] Set missing invested_at date for ${email} to ${investedAt.toISOString().split('T')[0]}`);
      } else {
        investedAt = new Date(invested_at);
      }
      weeksElapsed = differenceInWeeks(new Date(), investedAt);
      console.log(`[✅] DB fetch success — shares: ${shares}, invested_at: ${invested_at}`);
    }

    weeksElapsed = Math.floor(weeksElapsed);

    // Validate symbol
    let symbolValid = false;
    try {
      const testResponse = await retry(() =>
        axios.get('https://api.twelvedata.com/quote', {
          params: { symbol, apikey: twelveDataKey }
        })
      );
      if (testResponse.data.close && testResponse.data.symbol === symbol) {
        symbolValid = true;
        console.log(`[✅] Symbol ${symbol} is supported by Twelve Data`);
      }
    } catch (err) {
      console.warn(`[⚠️] Symbol ${symbol} may not be supported: ${err.message}`);
    }
    if (!symbolValid) {
      console.warn(`[⚠️] Falling back to default values for ${symbol}`);
    }

    // Fetch initial price at invested_at
    let initialPrice = 0;
    try {
      const timeSeriesResponse = await retry(() =>
        axios.get('https://api.twelvedata.com/time_series', {
          params: {
            symbol,
            apikey: twelveDataKey,
            interval: '1day',
            start_date: format(investedAt, 'yyyy-MM-dd'),
            end_date: format(investedAt, 'yyyy-MM-dd')
          }
        })
      );
      const data = timeSeriesResponse.data.values;
      if (data && data.length > 0) {
        initialPrice = parseFloat(data[0].close) || 0;
        console.log(`[📈] Initial price at ${investedAt.toISOString().split('T')[0]}: $${initialPrice}`);
      }
    } catch (err) {
      console.warn(`[⚠️] Failed to fetch initial price: ${err.message}. Will use current price as fallback.`);
    }

    // Dividend fetching
    const fetchDividends = async () => {
      try {
        const response = await retry(() =>
          axios.get('https://api.twelvedata.com/dividends', {
            params: {
              symbol,
              apikey: twelveDataKey,
              start_date: weeksElapsed < 1 ? '2020-01-01' : investedAt.toISOString().split('T')[0],
              end_date: new Date().toISOString().split('T')[0]
            }
          })
        );
        console.log(`[🌐] Twelve Data dividend response for ${symbol}`);
        fs.writeFileSync(cachePath, JSON.stringify(response.data, null, 2));
        console.log('[💾] Cached dividend data');
        return response.data.dividends || [];
      } catch (err) {
        console.error(`[❌] Dividend fetch error: ${err.message}`);
        if (fs.existsSync(cachePath)) {
          console.log('[🗂️] Using cached dividends');
          return JSON.parse(fs.readFileSync(cachePath, 'utf-8')).dividends || [];
        }
        throw new Error('No dividend data or cache available');
      }
    };

    // Process dividends
    const dividendData = await fetchDividends();
    const dividendValues = dividendData
      .map(div => parseFloat(div.amount) || 0)
      .filter(amount => amount > 0);
    const totalDividend = dividendValues.reduce((a, b) => a + b, 0);
    const avgWeeklyDividend = dividendValues.length ? totalDividend / dividendValues.length : 0.1;
    console.log(`[💰] Dividend values: ${dividendValues}`);
    console.log(`[📈] Average weekly dividend: $${avgWeeklyDividend.toFixed(4)}`);
    console.log(`[⏳] Weeks since investment: ${weeksElapsed}`);

    // Handle < 1 week case
    if (weeksElapsed < 1) {
      console.warn(`[⛔️] Less than one week elapsed. Showing anticipated earnings.`);

      // Calculate compounded dividends
      const result = calculateCompoundedDividends(initialShares, avgWeeklyDividend, 1);
      console.log(`[🔍] Compounded result:`, JSON.stringify(result));
      const earnedShares = typeof result.totalShares === 'number' && !isNaN(result.totalShares)
        ? parseFloat(result.totalShares)
        : 0;
      const totalSharesSum = Number(initialShares) + Number(earnedShares);
      const safeTotalShares = isNaN(totalSharesSum) ? initialShares : parseFloat(totalSharesSum.toFixed(4));
      const safeTotalDividends = typeof result.totalDividends === 'number' && !isNaN(result.totalDividends)
        ? result.totalDividends
        : 0;

      // Fetch live price
      let currentSharePrice = avgWeeklyDividend * 3;
      try {
        const quoteResponse = await retry(() =>
          axios.get('https://api.twelvedata.com/quote', {
            params: { symbol, apikey: twelveDataKey }
          })
        );
        currentSharePrice = parseFloat(quoteResponse.data.close || '0');
        console.log(`[📈] Live quote price for anticipated case: $${currentSharePrice}`);
      } catch (err) {
        console.warn(`[⚠️] Failed to fetch live quote: ${err.message}. Using fallback price.`);
      }

      // Use current price as initial if not fetched
      const effectiveInitialPrice = initialPrice || currentSharePrice || avgWeeklyDividend * 3;

      // Profit/Loss = (Current Value + Dividends) - Initial Investment
      const currentPortfolioValue = safeTotalShares * currentSharePrice;
      const initialInvestment = initialShares * effectiveInitialPrice;
      const profitOrLossUsd = parseFloat((currentPortfolioValue + safeTotalDividends - initialInvestment).toFixed(2));
      const totalInvestmentUsd = parseFloat(currentPortfolioValue.toFixed(2));

      console.log(`[💵] Profit/Loss calc: CurrentValue=$${currentPortfolioValue}, Dividends=$${safeTotalDividends}, Initial=$${initialInvestment}`);

      return res.json({
        symbol,
        investedAt: investedAt.toISOString().split('T')[0],
        weeksElapsed,
        totalShares: safeTotalShares,
        totalDividends: safeTotalDividends,
        weeklyDividendPerShare: avgWeeklyDividend,
        initialShares,
        totalInvestmentUsd, // Current portfolio value
        currentSharePrice,
        profitOrLossUsd,
        earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
        initialInvestment: parseFloat(initialInvestment.toFixed(2)),
        roiPercent: initialInvestment > 0
          ? parseFloat(((profitOrLossUsd / initialInvestment) * 100).toFixed(2))
          : 0,
        source: currentSharePrice !== avgWeeklyDividend * 3 ? 'twelve-data' : 'anticipated',
        isAnticipated: true
      });
    }

    // Live price via WebSocket
    let currentSharePrice = 0;
    const wsPromise = new Promise((resolve) => {
      const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?symbol=${symbol}&apikey=${twelveDataKey}`);
      ws.on('open', () => {
        console.log(`[🌐] WebSocket connected for ${symbol}`);
        ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: symbol } }));
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          if (msg.event === 'price' && msg.symbol === symbol) {
            currentSharePrice = parseFloat(msg.price) || 0;
            console.log(`[📈] Live price via WebSocket: $${currentSharePrice}`);
            ws.close();
            resolve();
          }
        } catch (err) {
          console.error(`[❌] WebSocket parse error: ${err.message}`);
        }
      });
      ws.on('error', (err) => {
        console.error(`[❌] WebSocket error: ${err.message}`);
        resolve();
      });
      setTimeout(() => {
        console.warn('[⏰] WebSocket timeout');
        ws.close();
        resolve();
      }, 5000);
    });

    await wsPromise;

    // Fallback to REST
    if (!currentSharePrice) {
      console.log('[🔄] Falling back to REST /quote endpoint');
      try {
        const quoteResponse = await retry(() =>
          axios.get('https://api.twelvedata.com/quote', {
            params: { symbol, apikey: twelveDataKey }
          })
        );
        currentSharePrice = parseFloat(quoteResponse.data.close || '0');
        console.log(`[📈] REST quote price: $${currentSharePrice}`);
      } catch (err) {
        console.error(`[❌] REST quote error: ${err.message}`);
      }
    }

    // Calculate results
    const result = calculateCompoundedDividends(initialShares, avgWeeklyDividend, weeksElapsed);
    console.log(`[🔍] Compounded result:`, JSON.stringify(result));
    const earnedShares = typeof result.totalShares === 'number' && !isNaN(result.totalShares)
      ? parseFloat(result.totalShares)
      : 0;
    const totalSharesSum = Number(initialShares) + Number(earnedShares);
    const safeTotalShares = isNaN(totalSharesSum) ? initialShares : parseFloat(totalSharesSum.toFixed(4));
    const safeTotalDividends = typeof result.totalDividends === 'number' && !isNaN(result.totalDividends)
      ? result.totalDividends
      : 0;

    // Use current price as initial if not fetched
    const effectiveInitialPrice = initialPrice || currentSharePrice || avgWeeklyDividend * 3;

    // Profit/Loss = (Current Value + Dividends) - Initial Investment
    const currentPortfolioValue = safeTotalShares * currentSharePrice;
    const initialInvestment = initialShares * effectiveInitialPrice;
    const profitOrLossUsd = parseFloat((currentPortfolioValue + safeTotalDividends - initialInvestment).toFixed(2));
    const totalInvestmentUsd = parseFloat(currentPortfolioValue.toFixed(2));

    console.log(`[💵] Profit/Loss calc: CurrentValue=$${currentPortfolioValue}, Dividends=$${safeTotalDividends}, Initial=$${initialInvestment}`);

    res.json({
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      totalShares: safeTotalShares,
      totalDividends: safeTotalDividends,
      weeklyDividendPerShare: avgWeeklyDividend,
      initialShares,
      totalInvestmentUsd, // Current portfolio value
      currentSharePrice,
      profitOrLossUsd,
      earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
      initialInvestment: parseFloat(initialInvestment.toFixed(2)),
      roiPercent: initialInvestment > 0
        ? parseFloat(((profitOrLossUsd / initialInvestment) * 100).toFixed(2))
        : 0,
      source: currentSharePrice ? 'twelve-data' : 'fallback',
      isAnticipated: false
    });
  } catch (err) {
    console.error(`[❌] Error: ${err.message}`);
    res.status(500).json({
      error: 'Failed to fetch data from Twelve Data',
      details: err.message,
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      initialShares,
      totalShares: initialShares,
      totalDividends: 0,
      weeklyDividendPerShare: 0,
      totalInvestmentUsd: 0,
      currentSharePrice: 0,
      profitOrLossUsd: 0,
      earnedShares: 0,
      initialInvestment: 0,
      roiPercent: 0,
      source: 'error-fallback',
      isAnticipated: true
    });
  }
};
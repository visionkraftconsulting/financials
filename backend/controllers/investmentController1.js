import axios from 'axios';
import { differenceInWeeks } from 'date-fns';
import { calculateCompoundedDividends } from '../utils/compoundCalculator.js';
import { executeQuery } from '../utils/db.js';
import fs from 'fs';
import path from 'path';

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

  try {
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

    weeksElapsed = Math.floor(weeksElapsed); // Ensure weeksElapsed is an integer

    if (weeksElapsed < 1) {
      console.warn(`[⛔️] Less than one full week since investment (${weeksElapsed} weeks). Showing anticipated earnings.`);

      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_WEEKLY_ADJUSTED',
          symbol,
          apikey: alphaVantageKey
        }
      });

      console.log(`[🌐] Alpha Vantage API response received for ${symbol}`);
      const timeSeries = response.data['Weekly Adjusted Time Series'];
      if (!timeSeries) {
        console.error(`[❌] Malformed Alpha Vantage response:`, response.data);

        const cachePath = path.resolve('dividends-cache.json');
        if (fs.existsSync(cachePath)) {
          console.log('[🗂️] Loading cached dividend data from dividends-cache.json');
          const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          response.data = cached;
        } else {
          throw new Error('Invalid Alpha Vantage response and no cached data available');
        }
      }

      const dividendValues = Object.values(timeSeries)
        .map(week => parseFloat(week['7. dividend amount']) || 0)
        .filter(amount => amount > 0);

      const totalDividend = dividendValues.reduce((a, b) => a + b, 0);
      const avgWeeklyDividend = dividendValues.length ? totalDividend / dividendValues.length : 0.1;

      const result = calculateCompoundedDividends(initialShares, avgWeeklyDividend, 1); // simulate 1 week
      const earnedShares = isNaN(result.totalShares) ? 0 : parseFloat(result.totalShares);
      const safeTotalShares = parseFloat((parseFloat(initialShares) + earnedShares).toFixed(4));
      const safeTotalDividends = typeof result.totalDividends === 'number' ? result.totalDividends : parseFloat(result.totalDividends) || 0;

      const currentSharePrice = avgWeeklyDividend * 3;
      console.log(`[📉] Current share price for ${symbol}: $${currentSharePrice}`);

      const totalInvestmentUsd = parseFloat((safeTotalShares * currentSharePrice).toFixed(2));
      const profitOrLossUsd = parseFloat((safeTotalDividends - totalInvestmentUsd).toFixed(2));

      console.log(`[💵] Total Investment (USD): $${totalInvestmentUsd}`);

      return res.json({
        symbol,
        investedAt: investedAt.toISOString().split('T')[0],
        weeksElapsed,
        totalShares: safeTotalShares,
        totalDividends: safeTotalDividends,
        weeklyDividendPerShare: avgWeeklyDividend,
        initialShares,
        totalInvestmentUsd,
        currentSharePrice,
        profitOrLossUsd,
        earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
        roiPercent: safeTotalDividends > 0 && totalInvestmentUsd > 0
          ? parseFloat(((safeTotalDividends / totalInvestmentUsd) * 100).toFixed(2))
          : 0,
        source: 'anticipated',
        isAnticipated: true
      });
    }

    const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_WEEKLY_ADJUSTED',
        symbol,
        apikey: alphaVantageKey
      }
    });

    console.log(`[🌐] Alpha Vantage API response received for ${symbol}`);
    const timeSeries = response.data['Weekly Adjusted Time Series'];
    if (!timeSeries) {
      console.error(`[❌] Malformed Alpha Vantage response:`, response.data);

      const cachePath = path.resolve('dividends-cache.json');
      if (fs.existsSync(cachePath)) {
        console.log('[🗂️] Loading cached dividend data from dividends-cache.json');
        const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        response.data = cached;
      } else {
        throw new Error('Invalid Alpha Vantage response and no cached data available');
      }
    }

    fs.writeFileSync(path.resolve('dividends-cache.json'), JSON.stringify(response.data, null, 2));
    console.log('[💾] Cached latest Alpha Vantage data');

    const dividendValues = Object.values(timeSeries)
      .map(week => parseFloat(week['7. dividend amount']) || 0)
      .filter(amount => amount > 0);

    const totalDividend = dividendValues.reduce((a, b) => a + b, 0);
    const avgWeeklyDividend = dividendValues.length ? totalDividend / dividendValues.length : 0.1;
    console.log(`[💰] Weekly dividend values:`, dividendValues);
    console.log(`[📈] Average weekly dividend: $${avgWeeklyDividend.toFixed(4)}`);
    console.log(`[⏳] Weeks since investment: ${weeksElapsed}`);

    const result = calculateCompoundedDividends(initialShares, avgWeeklyDividend, weeksElapsed);
    const safeTotalShares = typeof result.totalShares === 'number'
      ? parseFloat((initialShares + result.totalShares).toFixed(4))
      : initialShares;
    const safeTotalDividends = typeof result.totalDividends === 'number' ? result.totalDividends : parseFloat(result.totalDividends) || 0;

    const quoteRes = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: alphaVantageKey
      }
    });

    console.log(`[📊] GLOBAL_QUOTE response for ${symbol}:`, JSON.stringify(quoteRes.data, null, 2));

    const currentSharePrice = parseFloat(quoteRes.data['Global Quote']?.['05. price'] || '0');
    console.log(`[📉] Current share price for ${symbol}: $${currentSharePrice}`);

    const totalInvestmentUsd = parseFloat((safeTotalShares * currentSharePrice).toFixed(2));
    const profitOrLossUsd = parseFloat((safeTotalDividends - totalInvestmentUsd).toFixed(2));

    console.log(`[💵] Total Investment (USD): $${totalInvestmentUsd}`);

    res.json({
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      totalShares: safeTotalShares,
      totalDividends: safeTotalDividends,
      weeklyDividendPerShare: avgWeeklyDividend,
      initialShares,
      totalInvestmentUsd,
      currentSharePrice,
      profitOrLossUsd,
      earnedShares: parseFloat((safeTotalShares - initialShares).toFixed(4)),
      roiPercent: safeTotalDividends > 0 && totalInvestmentUsd > 0
        ? parseFloat(((safeTotalDividends / totalInvestmentUsd) * 100).toFixed(2))
        : 0,
      source: 'alpha-vantage',
      isAnticipated: false
    });
  } catch (err) {
    if (err.response) {
      console.error(`[❌] Dividend fetch error: HTTP ${err.response.status}`);
      console.error(`[❌] Response data:`, err.response.data);
    } else if (err.request) {
      console.error(`[❌] No response received from Alpha Vantage. Request:`, err.request);
    } else {
      console.error(`[❌] Error setting up request:`, err.message);
    }
    res.status(500).json({
      error: 'Failed to fetch dividend data from Alpha Vantage',
      details: err.response?.data || err.message,
      symbol,
      investedAt: investedAt.toISOString().split('T')[0],
      weeksElapsed,
      initialShares,
      totalShares: initialShares,
      totalDividends: 0,
      weeklyDividendPerShare: 0,
      totalInvestmentUsd: parseFloat((initialShares * 0 * weeksElapsed).toFixed(2)),
      earnedShares: 0,
      roiPercent: 0,
      source: 'error-fallback',
      isAnticipated: true
    });
  }
};
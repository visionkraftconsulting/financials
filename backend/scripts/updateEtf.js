import dotenv from 'dotenv';
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });

import OpenAI from 'openai';
import mysql from 'mysql2/promise';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getRecentEtfs(connection) {
  const [rows] = await connection.execute(`
    SELECT ticker, fund_name, yield_percent, dividend_rate, price
    FROM high_yield_etfs
    WHERE fetched_at >= NOW() - INTERVAL 1 HOUR
  `);
  return rows;
}

async function verifyYieldWithOpenAI({ ticker, fund_name, price, dividend_rate }) {
  const prompt = `The following ETF has a price of $${price} and an annual dividend rate of $${dividend_rate}. What is the correct yield percentage for ${fund_name} (${ticker})? Respond with just the number.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  if (
    response &&
    response.choices &&
    Array.isArray(response.choices) &&
    response.choices[0]?.message?.content
  ) {
    const answer = response.choices[0].message.content.trim();
    const parsed = parseFloat(answer.replace('%', ''));
    return isNaN(parsed) ? null : parsed;
  } else {
    console.warn(`⚠️ OpenAI response invalid for ${ticker}:`, JSON.stringify(response));
    return null;
  }
}

async function updateYield(connection, ticker, newYield) {
  await connection.execute(
    `UPDATE high_yield_etfs SET yield_percent = ?, verified_by_ai = 1 WHERE ticker = ?`,
    [newYield, ticker]
  );
  console.log(`✅ Updated ${ticker} yield to ${newYield}%`);
}

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const etfs = await getRecentEtfs(connection);

  for (const etf of etfs) {
    const correctYield = await verifyYieldWithOpenAI(etf);
    if (correctYield && Math.abs(correctYield - etf.yield_percent) > 1) {
      await updateYield(connection, etf.ticker, correctYield);
    } else {
      console.log(`🔍 ${etf.ticker} yield is accurate or within threshold.`);
    }
  }

  await connection.end();
})();

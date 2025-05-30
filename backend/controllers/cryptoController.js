import axios from 'axios';
import tmApi from '@api/tm-api';
import OpenAI from 'openai';
import db from '../utils/db.js'; // assumes a database utility is available

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Fetch top 100 cryptocurrencies by market cap
export const getTopCryptos = async (req, res) => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      }
    });
    const cryptos = response.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      total_volume: coin.total_volume
    }));
    return res.json(cryptos);
  } catch (err) {
    console.error('[❌] Failed to fetch top cryptocurrencies:', err.message);
    return res.status(500).json({ error: 'Failed to fetch top cryptocurrencies' });
  }
};

// Fetch suggested cryptocurrencies based on CoinGecko's trending endpoint
export const getSuggestedCryptos = async (req, res) => {
  try {
    const trendingRes = await axios.get(`${COINGECKO_API_URL}/search/trending`);
    const trendingIds = trendingRes.data.coins.map((c) => c.item.id);
    if (trendingIds.length === 0) {
      return res.json([]);
    }
    const marketRes = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: trendingIds.join(','),
        sparkline: false,
        price_change_percentage: '24h',
      },
    });
    const sorted = trendingIds
      .map((id) => marketRes.data.find((coin) => coin.id === id))
      .filter(Boolean);
    const cryptos = sorted.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      total_volume: coin.total_volume,
    }));
    return res.json(cryptos);
  } catch (err) {
    console.error('[❌] Failed to fetch suggested cryptocurrencies:', err.message);
    return res.json([]);
  }
};

// Fetch SGA Premium Picks using OpenAI Chat API and store suggestions in database
export const getSgaPicks = async (req, res) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    console.error('[❌] OPENAI_API_KEY is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error: missing OpenAI API key' });
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    const prompt = 'List 5 promising cryptocurrencies with strong growth potential in the next 12 months. Return them as a JSON array of names.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    if (
      !completion ||
      !completion.choices ||
      !completion.choices[0]?.message?.content
    ) {
      console.error('[❌] Invalid OpenAI response format:', JSON.stringify(completion, null, 2));
      return res.status(500).json({ error: 'OpenAI response missing choices' });
    }

    const textResponse = completion.choices[0].message.content;
    console.log('[🧠] OpenAI response:', textResponse);

    let coinNames = [];
    try {
      coinNames = JSON.parse(textResponse);
      if (!Array.isArray(coinNames)) throw new Error('Invalid format');
    } catch (parseErr) {
      console.error('[❌] Failed to parse OpenAI response:', parseErr.message);
      return res.status(500).json({ error: 'Invalid OpenAI response format' });
    }

    const now = new Date();
    for (const name of coinNames) {
      const [existing] = await db.query('SELECT 1 FROM sga_picks WHERE coin_name = ? LIMIT 1', [name]);
      if (existing.length === 0) {
        await db.query('INSERT INTO sga_picks (coin_name, suggested_at) VALUES (?, ?)', [name, now]);
      }
    }

    return res.json({ suggestions: coinNames });
  } catch (err) {
    console.error('[❌] Failed to fetch SGA picks from OpenAI:', err.message);
    return res.status(500).json({ error: 'Failed to fetch SGA picks' });
  }
};
// Fetch stored SGA picks from the database
export const getStoredSgaPicks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT coin_name, suggested_at FROM sga_picks ORDER BY suggested_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to fetch stored SGA picks:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stored SGA picks' });
  }
};
import axios from 'axios';
import tmApi from '@api/tm-api';

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
    return res.status(500).json({ error: 'Failed to fetch suggested cryptocurrencies' });
  }
};

// Fetch SGA Premium Picks using Token Metrics AI API
export const getSgaPicks = async (req, res) => {
  const apiKey = process.env.TM_API_KEY;
  const TM_BASE_URL = 'https://api.tokenmetrics.com/v2/';
  if (!apiKey) {
    console.error('[❌] TM_API_KEY is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error: missing API key' });
  }

  try {
    console.log('[🧪] TM_API_KEY prefix:', apiKey.slice(0, 10) + '...');
    console.log('[🧪] Sending request to tmApi.tmai with headers:', {
      'x-api-key': apiKey.slice(0, 10) + '...'
    });
    console.log('[🧪] Payload:', {
      messages: [{ user: 'What is the next 100x coin ?' }]
    });
    const response = await tmApi.tmai(
      {
        messages: [{ user: 'What is the next 100x coin ?' }]
      },
      {
        'x-api-key': apiKey
      }
    );
    return res.json(response.data);
  } catch (err) {
    console.error('[❌] Failed to fetch SGA Premium Picks:', err.message);
    return res.status(500).json({ error: 'Failed to fetch SGA Premium Picks' });
  }
};
import axios from 'axios';

// Controller to fetch latest crypto news from CryptoPanic API
export const getNews = async (req, res) => {
  const baseUrl =
    process.env.CRYPTOPANIC_API_BASE_URL ||
    'https://cryptopanic.com/api/developer/v2';
  const token = process.env.CRYPTOPANIC_API_TOKEN;

  if (!token) {
    console.error('[❌] CRYPTOPANIC_API_TOKEN is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error: missing CryptoPanic API token' });
  }

  try {
    const instance = axios.create({
      baseURL: baseUrl,
      headers: {
        'User-Agent': 'InvestmentTrackerBot/1.0',
      },
      params: {
        auth_token: token,
      },
    });

    console.log('[🌐] Requesting CryptoPanic posts...');
    const { data } = await instance.get('/posts/');

    return res.json(data.results || []);
  } catch (err) {
    console.error('[❌] Failed to fetch CryptoPanic news:', err.message);
    console.error('[❌] Full error:', err.response?.data || err);
    return res.status(500).json({ error: 'Failed to fetch crypto news' });
  }
};
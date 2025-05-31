import axios from 'axios';

// Controller to fetch latest crypto news from CryptoPanic API
export const getNews = async (req, res) => {
  const baseUrl = process.env.CRYPTO_PANIC_API_BASE_URL || 'https://cryptopanic.com/api/developer/v2';
  const token = process.env.CRYPTO_PANIC_API_TOKEN;

  if (!token) {
    console.error('[❌] CRYPTOPANIC_API_TOKEN is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error: missing CryptoPanic API token' });
  }

  try {
    const { data } = await axios.get(`${baseUrl}/posts`, {
      params: { auth_token: token },
    });
    return res.json(data.results || []);
  } catch (err) {
    console.error('[❌] Failed to fetch CryptoPanic news:', err.message);
    return res.status(500).json({ error: 'Failed to fetch crypto news' });
  }
};
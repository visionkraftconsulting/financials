import { extractImageFromMeta } from '../helpers/extractImageFromMeta.js';
import axios from 'axios';
import googleTranslateApi from '@vitalets/google-translate-api';
const translate = googleTranslateApi.default || googleTranslateApi;
// dynamically imported when needed

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
    const rssUrl = `${baseUrl}/posts/?auth_token=${token}&format=rss`;
    console.log('[🌐] Requesting CryptoPanic RSS feed...');
    const rssRes = await axios.get(rssUrl, {
      headers: { 'User-Agent': 'InvestmentTrackerBot/1.0' }
    });

    const xml = rssRes.data;
    try {
      const { parseStringPromise } = await import('xml2js');
      const parsed = await parseStringPromise(xml, { explicitArray: false });
          const items = parsed.rss?.channel?.item || [];
          const itemsWithImages = await Promise.all((Array.isArray(items) ? items : [items]).map(async (item) => {
            try {
              const lang = await translate(item.title, { to: 'en' });
              if (lang.from.language.iso !== 'en') {
                console.log(`[🌐] Skipping non-English article: ${item.title}`);
                return null;
              }
              const image = await extractImageFromMeta(item.link);
              return {
                ...item,
                title: item.title,
                description: item.description,
                image,
              };
            } catch (error) {
              console.warn(`[⚠️] Translation check failed for "${item.title}":`, error.message);
              return null;
            }
          }));
          return res.json(itemsWithImages.filter(Boolean));
    } catch (parseErr) {
      console.error('[❌] Failed to parse CryptoPanic RSS XML:', parseErr.message);
      console.error('[❌] XML response:', xml);
      return res.status(500).json({ error: 'Failed to parse crypto news feed' });
    }
  } catch (err) {
    console.error('[❌] Failed to fetch CryptoPanic news:', err.message);
    console.error('[❌] Full error:', err.response?.data || err);
    return res.status(500).json({ error: 'Failed to fetch crypto news' });
  }
};
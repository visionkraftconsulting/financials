import { pool } from '../utils/db.js';
import axios from 'axios';
import { translate } from '@vitalets/google-translate-api';

const fmpBaseUrl = 'https://financialmodelingprep.com/stable/news/crypto-latest';

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
    const results = data.results || [];

    const translatedResults = await Promise.all(
      results.map(async (post) => {
        try {
          const { title } = post;
          try {
            const translation = await translate(title, { to: 'en' });
            await saveNewsToDb({
              title: translation.text,
              original_title: title,
              detected_lang: translation?.from?.language?.iso || 'unknown',
              source: post.source,
              published_at: post.published_at,
              url: post.url,
              summary: post.body,
              image: post.thumbnail,
              source_type: 'cryptopanic',
              symbol: null
            });
            return {
              ...post,
              original_title: title,
              title: translation.text,
              detected_lang: translation?.from?.language?.iso || 'unknown',
            };
          } catch (tError) {
            console.warn(`[⚠️] Google Translate failed: ${tError.message}`);
            try {
              const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                  model: 'gpt-4',
                  messages: [
                    { role: 'system', content: 'You are a translation engine.' },
                    { role: 'user', content: `Translate this to English: ${title}` },
                  ],
                  temperature: 0,
                }),
              });
              const aiData = await openAiResponse.json();
              const translatedText = aiData.choices?.[0]?.message?.content || title;
              return {
                ...post,
                original_title: title,
                title: translatedText,
                detected_lang: 'fallback-ai',
              };
            } catch (aiError) {
              console.warn(`[⚠️] OpenAI fallback failed for "${title}": ${aiError.message}`);
              return {
                ...post,
                original_title: title,
                title: title,
                detected_lang: 'unknown',
              };
            }
          }
        } catch (error) {
          console.warn(`[⚠️] Translation failed for "${post.title}": ${error.message}`);
          return post; // fallback to original post if translation fails
        }
      })
    );

    // Fetch additional crypto news from FMP
    let fmpNews = [];
    try {
      const fmpResponse = await axios.get(fmpBaseUrl, {
        params: {
          from: req.query.from || '2025-01-10',
          to: req.query.to || '2025-04-11',
          page: req.query.page || 0,
          limit: req.query.limit || 20,
          apikey: process.env.FMP_API_KEY,
        },
      });

      if (Array.isArray(fmpResponse.data)) {
        fmpNews = await Promise.all(fmpResponse.data.map(async item => {
          const newsItem = {
            symbol: item.symbol,
            published_at: item.publishedDate,
            title: item.title,
            source: item.publisher || item.site,
            summary: item.text,
            image: item.image,
            url: item.url,
            source_type: 'fmp'
          };
          await saveNewsToDb(newsItem);
          return newsItem;
        }));
      }
    } catch (fmpError) {
      console.warn('[⚠️] Failed to fetch FMP news:', fmpError.message);
    }

    // Fetch additional FMP news categories
    // Define all FMP endpoints and their source types
    const fmpEndpoints = [
      {
        url: 'https://financialmodelingprep.com/stable/fmp-articles',
        source_type: 'fmp-articles'
      },
      {
        url: 'https://financialmodelingprep.com/stable/news/general-latest',
        source_type: 'fmp-general'
      },
      {
        url: 'https://financialmodelingprep.com/stable/news/press-releases-latest',
        source_type: 'fmp-press'
      },
      {
        url: 'https://financialmodelingprep.com/stable/news/stock-latest',
        source_type: 'fmp-stock'
      },
      {
        url: 'https://financialmodelingprep.com/stable/news/forex-latest',
        source_type: 'fmp-forex'
      }
    ];

    for (const endpoint of fmpEndpoints) {
      try {
        const { url, source_type } = endpoint;
        const response = await axios.get(url, {
          params: {
            from: req.query.from || '2025-01-10',
            to: req.query.to || '2025-04-11',
            page: req.query.page || 0,
            limit: req.query.limit || 20,
            apikey: process.env.FMP_API_KEY
          }
        });

        if (Array.isArray(response.data)) {
          const items = await Promise.all(response.data.map(async item => {
            const newsItem = {
              symbol: item.symbol || item.tickers || null,
              published_at: item.publishedDate || item.date,
              title: item.title,
              source: item.publisher || item.site,
              summary: item.text || item.content,
              image: item.image,
              url: item.url || item.link,
              source_type
            };
            await saveNewsToDb(newsItem);
            return newsItem;
          }));
          fmpNews.push(...items);
        }
      } catch (fmpErr) {
        console.warn(`[⚠️] Failed to fetch ${endpoint.source_type} news:`, fmpErr.message);
      }
    }

    return res.json([...translatedResults, ...fmpNews]);
  } catch (err) {
    console.error('[❌] Failed to fetch CryptoPanic news:', err.message);
    console.error('[❌] Full error:', err.response?.data || err);
    return res.status(500).json({ error: 'Failed to fetch crypto news' });
  }
};

const saveNewsToDb = async (newsItem) => {
  try {
    // Replace with your actual DB insert logic (e.g., using Prisma, Sequelize, or raw query)
    console.log('[💾] Saving news to DB:', newsItem.title);
    // await db.news.create({ data: newsItem });
  } catch (err) {
    console.error('[❌] Failed to save news to DB:', err.message);
  }
};


// Controller to fetch stored news from the database with pagination and polling support
export const getStoredNews = async (req, res) => {
  try {
    console.log('[📥] Fetching stored news from DB...');

    const page = parseInt(req.query.page || '0');
    const limit = parseInt(req.query.limit || '20');
    const offset = page * limit;

    const sql = `
      SELECT id, title, url, source, summary, image, published_at, source_type
      FROM crypto_news
      ORDER BY published_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const [rows] = await pool.execute(sql);
    return res.json(rows);
  } catch (err) {
    console.error('[❌] Failed to fetch stored news:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stored news' });
  }
};

const startNewsPolling = () => {
  const interval = 5 * 60 * 1000; // 5 minutes

  setInterval(async () => {
    console.log('[⏱️] Auto-fetching latest news in background...');
    try {
      await getNews(
        { query: {}, headers: {}, body: {}, method: 'GET' }, 
        { json: () => {}, status: () => ({ json: () => {} }) }
      );
    } catch (err) {
      console.error('[❌] Background news fetch failed:', err.message);
    }
  }, interval);
};

startNewsPolling();
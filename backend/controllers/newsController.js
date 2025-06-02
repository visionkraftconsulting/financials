import axios from 'axios';
import translate from '@vitalets/google-translate-api';

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
            return {
              ...post,
              original_title: title,
              title: translation.text,
              detected_lang: translation.from.language.iso,
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
              return post;
            }
          }
        } catch (error) {
          console.warn(`[⚠️] Translation failed for "${post.title}": ${error.message}`);
          return post; // fallback to original post if translation fails
        }
      })
    );

    return res.json(translatedResults);
  } catch (err) {
    console.error('[❌] Failed to fetch CryptoPanic news:', err.message);
    console.error('[❌] Full error:', err.response?.data || err);
    return res.status(500).json({ error: 'Failed to fetch crypto news' });
  }
};
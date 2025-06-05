import axios from 'axios';
import axiosRetry from 'axios-retry';
import tmApi from '@api/tm-api';
import OpenAI from 'openai';
import db from '../utils/db.js'; // assumes a database utility is available
import pLimit from 'p-limit';
import cron from 'node-cron';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const TWELVE_DATA_API_URL = 'https://api.twelvedata.com';
const FMP_API_URL = 'https://financialmodelingprep.com/api/v3';
const POLYGON_API_URL = 'https://api.polygon.io';
let coinListCache = null;

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429;
  },
});

// List supported crypto assets from database table
export const getCryptoInvestmentsList = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT symbol, name FROM crypto_investments ORDER BY symbol'
    );
    return res.json(rows);
  } catch (err) {
    console.error('[❌] getCryptoInvestmentsList error:', err.message);
    return res.status(500).json({ error: 'Failed to load crypto investments list' });
  }
};

export { getCoinGeckoId };

/**
 * Fetch historical price for a crypto asset on a given date via Twelve Data
 */
export const getHistoricalCryptoPrice = async (req, res) => {
  const { symbol, date } = req.query;
  if (!symbol || !date) {
    return res.status(400).json({ error: 'Missing symbol or date parameter' });
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    console.error('[❌] TWELVE_DATA_API_KEY is not defined');
    return res.status(500).json({ error: 'Server configuration error: missing Twelve Data API key' });
  }
  try {
    const resp = await axios.get(
      `${TWELVE_DATA_API_URL}/time_series`,
      {
        params: {
          symbol: `${symbol}/USD`,
          apikey: apiKey,
          interval: '1day',
          start_date: date,
          end_date: date
        }
      }
    );
    const values = resp.data?.values;
    const price = values && values.length > 0 ? parseFloat(values[0].close) : null;
    if (price != null) {
      return res.json({ symbol, date, price });
    }
    // Fallback chain: CoinGecko -> Financial Modeling Prep -> Polygon.io
    // 1. CoinGecko
    try {
      const cgId = await getCoinGeckoId(symbol);
      if (cgId) {
        const [year, month, day] = date.split('-');
        const cgDate = `${day}-${month}-${year}`; // DD-MM-YYYY
        const cgResp = await axios.get(
          `${COINGECKO_API_URL}/coins/${cgId}/history`,
          { params: { date: cgDate } }
        );
        const cgPrice = cgResp.data?.market_data?.current_price?.usd;
        if (cgPrice != null) {
          return res.json({ symbol, date, price: cgPrice });
        }
      }
    } catch (cgErr) {
      console.error('[⚠️] getHistoricalCryptoPrice CoinGecko fallback error:', cgErr.message);
    }
    // 2. Financial Modeling Prep
    const fmpKey = process.env.FMP_API_KEY;
    if (fmpKey) {
      try {
        const fmpResp = await axios.get(
          `${FMP_API_URL}/crypto/historical-price-full/${symbol}`,
          { params: { from: date, to: date, apikey: fmpKey } }
        );
        const fmpData = fmpResp.data?.historical;
        const fmpPrice = fmpData && fmpData.length > 0 ? parseFloat(fmpData[0].close) : null;
        if (fmpPrice != null) {
          return res.json({ symbol, date, price: fmpPrice });
        }
      } catch (fmpErr) {
        console.error('[⚠️] getHistoricalCryptoPrice FMP fallback error:', fmpErr.message);
      }
    } else {
      console.warn('[⚠️] FMP_API_KEY is not defined, skipping FMP fallback');
    }
    // 3. Polygon.io
    const polyKey = process.env.POLYGON_API_KEY;
    if (polyKey) {
      try {
        const polySymbol = `C:${symbol.toUpperCase()}USD`;
        const polyResp = await axios.get(
          `${POLYGON_API_URL}/v2/aggs/ticker/${polySymbol}/range/1/day/${date}/${date}`,
          { params: { adjusted: 'true', sort: 'asc', limit: 1, apiKey: polyKey } }
        );
        const results = polyResp.data?.results;
        const polyPrice = results && results.length > 0 ? parseFloat(results[0].c) : null;
        if (polyPrice != null) {
          return res.json({ symbol, date, price: polyPrice });
        }
      } catch (polyErr) {
        console.error('[⚠️] getHistoricalCryptoPrice Polygon fallback error:', polyErr.message);
      }
    } else {
      console.warn('[⚠️] POLYGON_API_KEY is not defined, skipping Polygon fallback');
    }
    return res.status(404).json({ error: `Price not found for ${symbol} on ${date}` });
  } catch (err) {
    console.error('[❌] getHistoricalCryptoPrice error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Fetch current price for a crypto asset via Twelve Data quote API
 */
export const getCurrentCryptoPrice = async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing symbol parameter' });
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    console.error('[❌] TWELVE_DATA_API_KEY is not defined');
    return res.status(500).json({ error: 'Server configuration error: missing Twelve Data API key' });
  }
  try {
    const resp = await axios.get(
      `${TWELVE_DATA_API_URL}/quote`,
      {
        params: { symbol: `${symbol}/USD`, apikey: apiKey }
      }
    );
    const price = resp.data?.close != null ? parseFloat(resp.data.close) : null;
    if (price != null) {
      return res.json({ symbol, price });
    }
    // Fallback chain: CoinGecko -> Financial Modeling Prep -> Polygon.io
    // 1. CoinGecko
    try {
      const cgId = await getCoinGeckoId(symbol);
      if (cgId) {
        const cgResp = await axios.get(
          `${COINGECKO_API_URL}/simple/price`,
          { params: { ids: cgId, vs_currencies: 'usd' } }
        );
        const cgPrice = cgResp.data?.[cgId]?.usd;
        if (cgPrice != null) {
          return res.json({ symbol, price: cgPrice });
        }
      }
    } catch (cgErr) {
      console.error('[⚠️] getCurrentCryptoPrice CoinGecko fallback error:', cgErr.message);
    }
    // 2. Financial Modeling Prep
    const fmpKey = process.env.FMP_API_KEY;
    if (fmpKey) {
      try {
        const fmpResp = await axios.get(
          `${FMP_API_URL}/crypto/real-time-price/${symbol}`,
          { params: { apikey: fmpKey } }
        );
        const fmpPrice = fmpResp.data?.price;
        if (fmpPrice != null) {
          return res.json({ symbol, price: parseFloat(fmpPrice) });
        }
      } catch (fmpErr) {
        console.error('[⚠️] getCurrentCryptoPrice FMP fallback error:', fmpErr.message);
      }
    } else {
      console.warn('[⚠️] FMP_API_KEY is not defined, skipping FMP fallback');
    }
    // 3. Polygon.io
    const polyKey = process.env.POLYGON_API_KEY;
    if (polyKey) {
      try {
        const polySymbol = `C:${symbol.toUpperCase()}USD`;
        const polyResp = await axios.get(
          `${POLYGON_API_URL}/v2/aggs/ticker/${polySymbol}/prev`,
          { params: { apiKey: polyKey } }
        );
        const results = polyResp.data?.results;
        const polyPrice = results && results.length > 0 ? parseFloat(results[0].c) : null;
        if (polyPrice != null) {
          return res.json({ symbol, price: polyPrice });
        }
      } catch (polyErr) {
        console.error('[⚠️] getCurrentCryptoPrice Polygon fallback error:', polyErr.message);
      }
    } else {
      console.warn('[⚠️] POLYGON_API_KEY is not defined, skipping Polygon fallback');
    }
    return res.status(404).json({ error: `Current price not found for ${symbol}` });
  } catch (err) {
    console.error('[❌] getCurrentCryptoPrice error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

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
    // Compute summary statistics
    const summary = {
      total_cryptos: cryptos.length,
      total_market_cap: cryptos.reduce((sum, c) => sum + (c.market_cap || 0), 0),
      total_volume: cryptos.reduce((sum, c) => sum + (c.total_volume || 0), 0),
      avg_24h_change: cryptos.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / cryptos.length,
    };
    const [sgaCountRows] = await db.query('SELECT COUNT(DISTINCT coin_name) AS count FROM sga_picks');
    summary.sga_picks_count = sgaCountRows[0]?.count || 0;

    // Save to DB
    for (const coin of cryptos) {
      await db.query(
        `REPLACE INTO top_cryptos 
         (id, symbol, name, image, current_price, market_cap, market_cap_rank,
          price_change_percentage_24h, total_volume, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          coin.id,
          coin.symbol,
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.price_change_percentage_24h,
          coin.total_volume
        ]
      );
    }

    // Add sga_picks_symbols to summary
    const [sgaSymbolsRows] = await db.query(`
      SELECT DISTINCT tp.symbol
      FROM sga_picks sp
      JOIN top_cryptos tp ON LOWER(sp.coin_name) = LOWER(tp.name)
    `);
    summary.sga_picks_symbols = sgaSymbolsRows.map(r => r.symbol);

    return res.json({ summary, data: cryptos });
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error(
      '[❌] Failed to fetch top cryptocurrencies:',
      status ? `Status ${status}` : err.message,
      data || ''
    );
    try {
      const [rows] = await db.query(
        'SELECT * FROM top_cryptos ORDER BY market_cap_rank ASC LIMIT 100'
      );
      return res.json(rows);
    } catch (dbErr) {
      console.error('[❌] Failed to serve top cryptos from DB:', dbErr.message);
      return res.status(500).json({ error: 'Failed to fetch top cryptocurrencies' });
    }
  }
};

// Fetch suggested cryptocurrencies based on CoinGecko's trending endpoint, cache in DB, and serve fallback
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

    // Store in DB
    for (const coin of sorted) {
      await db.query(
        `REPLACE INTO trending_cryptos 
         (id, symbol, name, image, current_price, market_cap, market_cap_rank, 
          price_change_percentage_24h, total_volume, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          coin.id,
          coin.symbol,
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.price_change_percentage_24h,
          coin.total_volume
        ]
      );
    }

    return res.json(sorted);
  } catch (err) {
    console.error('[⚠️] API failed, serving cached trending cryptos:', err.message);
    try {
      const [rows] = await db.query(
        'SELECT * FROM trending_cryptos ORDER BY updated_at DESC LIMIT 7'
      );
      return res.json(rows);
    } catch (dbErr) {
      console.error('[❌] Failed to fetch trending cryptos from DB:', dbErr.message);
      return res.status(500).json({ error: 'Failed to fetch suggested cryptocurrencies' });
    }
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
    const prompt = `List two arrays only:
1. 'picks': 20 promising cryptocurrencies for the next 12 months.
2. 'gems': 50 lesser-known cryptocurrencies with 100x potential.
Return only a valid JSON object with 'picks' and 'gems' keys. No extra text or markdown.`;

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

    let parsed;
    try {
      let jsonText = textResponse.match(/{[\s\S]*}/)?.[0];
      if (!jsonText) throw new Error('No valid JSON found in response');
      parsed = JSON.parse(jsonText);
      if (!parsed || !Array.isArray(parsed.picks) || !Array.isArray(parsed.gems)) {
        throw new Error('Invalid format');
      }
    } catch (parseErr) {
      console.error('[❌] Failed to parse OpenAI response:', parseErr.message);
      return res.status(500).json({ error: 'Invalid OpenAI response format' });
    }

    const now = new Date();
    const allNames = [...parsed.picks, ...parsed.gems];
    // Insert each name only if it doesn't already exist (case-insensitive)
    for (const name of allNames) {
      const [existing] = await db.query(
        'SELECT 1 FROM sga_picks WHERE LOWER(coin_name) = LOWER(?) LIMIT 1',
        [name]
      );
      if (!existing.length) {
        await db.query('INSERT INTO sga_picks (coin_name, suggested_at) VALUES (?, ?)', [name, now]);
      }
    }

    const limit = pLimit(3);
    const idMap = {};
    await Promise.all(
      allNames.map((name) =>
        limit(async () => {
          const id = await getCoinGeckoId(name);
          if (id) idMap[name] = id;
        })
      )
    );

    const marketData = await getMarketData(Object.values(idMap));

    const enriched = allNames.map(name => {
      const coin = marketData.find(c => c.id === idMap[name]);
      return coin
        ? {
            coin_name: name,
            market_cap: coin.market_cap,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            total_volume: coin.total_volume,
            circulating_supply: coin.circulating_supply
          }
        : null;
    }).filter(Boolean);

    return res.json({ suggestions: parsed, enriched });
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

const getCoinGeckoId = async (name) => {
  try {
    if (!coinListCache) {
      const listRes = await axios.get(`${COINGECKO_API_URL}/coins/list`);
      coinListCache = listRes.data;
    }

    const normalized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const match = coinListCache.find((c) =>
      c.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === normalized
    );

    return match?.id || null;
  } catch (err) {
    console.error(`[❌] Failed to get CoinGecko ID for ${name}:`, err.message);
    return null;
  }
};

const getMarketData = async (ids) => {
  try {
    const res = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        ids: ids.join(','),
        price_change_percentage: '24h',
        sparkline: false
      }
    });
    return res.data;
  } catch (err) {
    console.error('[❌] Failed to fetch CoinGecko market data:', err.message);
    return [];
  }
};

export const getEnrichedSgaPicks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT coin_name FROM sga_picks');
    const coinNames = rows.map(r => r.coin_name);

    const limit = pLimit(3);
    const idMap = {};
    await Promise.all(
      coinNames.map((name) =>
        limit(async () => {
          const id = await getCoinGeckoId(name);
          if (id) idMap[name] = id;
        })
      )
    );

    const marketData = await getMarketData(Object.values(idMap));

    const enriched = coinNames.map(name => {
      const coin = marketData.find(c => c.id === idMap[name]);
      return coin ? { coin_name: name, ...coin } : null;
    }).filter(Boolean);

    return res.json(enriched);
  } catch (err) {
    console.error('[❌] Failed to enrich SGA picks:', err.message);
    return res.status(500).json({ error: 'Failed to enrich SGA picks' });
  }
};

// Scheduled update of trending cryptos every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[⏰] Running periodic trending crypto cache update...');
  try {
    const trendingRes = await axios.get(`${COINGECKO_API_URL}/search/trending`);
    const trendingIds = trendingRes.data.coins.map((c) => c.item.id);
    if (!trendingIds.length) return;

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

    for (const coin of sorted) {
      await db.query(
        `REPLACE INTO trending_cryptos 
         (id, symbol, name, image, current_price, market_cap, market_cap_rank, 
          price_change_percentage_24h, total_volume, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          coin.id,
          coin.symbol,
          coin.name,
          coin.image,
          coin.current_price,
          coin.market_cap,
          coin.market_cap_rank,
          coin.price_change_percentage_24h,
          coin.total_volume
        ]
      );
    }

    console.log(`[✅] Updated ${sorted.length} trending cryptos`);
  } catch (err) {
    console.error('[❌] Failed to update trending cryptos on schedule:', err.message);
  }
});
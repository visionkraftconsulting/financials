import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Extracts the og:image URL from a given article link.
 * @param {string} url - The article URL.
 * @returns {Promise<string|null>} - The extracted image URL or null if not found.
 */
export async function extractImageFromMeta(url) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (NewsBot)' },
      timeout: 5000
    });

    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr('content');

    return ogImage || null;
  } catch (err) {
    console.warn(`[⚠️] Failed to fetch or parse image from: ${url} — ${err.message}`);
    return null;
  }
}
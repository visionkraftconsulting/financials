import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({ path: '/home/bitnami/scripts/financial/investment-tracker/backend/.env' });

const TOKEN_PATH = path.resolve('tokens.json');

export async function login() {
  const username = process.env.API_USERNAME;
  const password = process.env.API_PASSWORD;
  const baseUrl = process.env.API_BASE_URL?.trim();
  console.log('[🔧] Base URL:', baseUrl);

  if (!username || !password || !baseUrl) {
    console.error('[❌] Missing required environment variables:');
    if (!username) console.error(' - API_USERNAME is not set');
    if (!password) console.error(' - API_PASSWORD is not set');
    if (!baseUrl) console.error(' - API_BASE_URL is not set');
    throw new Error('Required .env configuration missing');
  }

  try {
    const response = await axios.post(`${baseUrl}/login`, {
      username,
      password
    });

    const tokens = response.data;
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');

    console.log('[🔐] Login successful. Tokens saved.');
    return tokens;
  } catch (error) {
    console.error('[❌] Login failed:', error.response?.data || error.message);
    throw error;
  }
}

export function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No tokens found. Please authenticate using /login endpoint.');
  }

  const data = fs.readFileSync(TOKEN_PATH, 'utf-8');
  return JSON.parse(data);
}

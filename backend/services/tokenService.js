import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '../tokens.json');

function loadTokens() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No tokens found. Please authenticate using /login endpoint.');
  }
  const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function saveTokens(tokens) {
  const data = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000
  };
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2), { mode: 0o600 });
}

async function refreshTokenIfNeeded() {
  const tokens = loadTokens();
  if (Date.now() < tokens.expires_at - 60000) {
    return tokens.access_token;
  }
  console.log('🔄 Refreshing Schwab access token');
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.SCHWAB_CLIENT_ID,
    client_secret: process.env.SCHWAB_CLIENT_SECRET,
    refresh_token: tokens.refresh_token
  });
  const res = await fetch('https://api.schwab.com/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${body}`);
  }
  const newTokens = await res.json();
  await saveTokens(newTokens);
  console.log('🔄 Schwab access token refreshed');
  return newTokens.access_token;
}

async function getAccessToken() {
  return refreshTokenIfNeeded();
}

export { getAccessToken, saveTokens, refreshTokenIfNeeded };
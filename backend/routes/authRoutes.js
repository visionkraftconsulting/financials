import express from 'express';
import { register, login } from '../controllers/authController.js';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { saveTokens } from '../services/tokenService.js';

const router = express.Router();
router.post('/register', register);
router.post('/login', login);

router.get('/schwab/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const authUrl = new URL('https://api.schwab.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', process.env.SCHWAB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', process.env.SCHWAB_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  res.redirect(authUrl.toString());
});

router.get('/schwab/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SCHWAB_CLIENT_ID,
      client_secret: process.env.SCHWAB_CLIENT_SECRET,
      redirect_uri: process.env.SCHWAB_REDIRECT_URI,
      code: String(code)
    });
    const tokenRes = await fetch('https://api.schwab.com/oauth2/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('Token exchange error', tokenRes.status, text);
      return res.status(tokenRes.status).json({ error: 'Token exchange failed', details: text });
    }
    const tokens = await tokenRes.json();
    await saveTokens(tokens);
    console.log('🔐 Schwab tokens saved');
    const frontend = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production'
      ? 'https://smartgrowthassets.com'
      : 'http://localhost:4005');
    return res.redirect(`${frontend.replace(/\/+$/, '')}/investments`);
  } catch (err) {
    console.error('Error in callback handler', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
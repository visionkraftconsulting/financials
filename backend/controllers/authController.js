import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
// Token validity period (default to 24h; override via .env TOKEN_EXPIRATION)
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '24h';

export const register = async (req, res) => {
  const { email, password, name, phone, country } = req.body;
  if (!email || !password || !name || !phone) {
    return res.status(400).json({ msg: 'Email, password, name, and phone number are required' });
  }
  try {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ msg: 'User already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await executeQuery(
      'INSERT INTO users (email, password, name, phone, country) VALUES (?, ?, ?, ?, ?)',
      [email, hashed, name, phone, country || null]
    );
    return res.status(201).json({ msg: 'User created successfully' });
  } catch (err) {
    console.error('[❌] Registration error:', err.message);
    return res.status(500).json({ msg: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }
  try {
    const users = await executeQuery(
      'SELECT id, password, role FROM users WHERE email = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    console.log(`[🔐] Password match for ${email}: ${match}`);
    if (!match) {
      console.log(`[❌] Invalid credentials for ${email}`);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );
    console.log(`[🔐] User authenticated: ${email} (expires in ${TOKEN_EXPIRATION})`);
    return res.json({ token });
  } catch (err) {
    console.error('[❌] Login error:', err.message);
    return res.status(500).json({ msg: 'Server error during login' });
  }
};
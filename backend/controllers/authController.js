import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = '1h';

export const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: 'Email and password are required' });
  }
  try {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ msg: 'User already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await executeQuery(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashed, name || null]
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
    const users = await executeQuery('SELECT id, password FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET, {
      expiresIn: TOKEN_EXPIRATION
    });
    return res.json({ token });
  } catch (err) {
    console.error('[❌] Login error:', err.message);
    return res.status(500).json({ msg: 'Server error during login' });
  }
};
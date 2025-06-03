import express from 'express';
import { getNews, getStoredNews } from '../controllers/newsController.js';

const router = express.Router();

// GET /api/news - fetch latest crypto news via CryptoPanic API
router.get('/', getNews);

// GET /api/news/stored - fetch stored crypto news from DB
router.get('/stored', getStoredNews);

export default router;
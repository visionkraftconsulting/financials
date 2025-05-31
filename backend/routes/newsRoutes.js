import express from 'express';
import { getNews } from '../controllers/newsController.js';

const router = express.Router();

// GET /api/news - fetch latest crypto news via CryptoPanic API
router.get('/', getNews);

export default router;
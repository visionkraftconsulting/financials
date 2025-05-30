import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import investmentRoutes from './routes/investmentRoutes.js';
import btcRoutes from './routes/btcRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import etfRoutes from './routes/etfRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';
import cryptoRoutes from './routes/cryptoRoutes.js';
import newsRoutes from './routes/newsRoutes.js';


dotenv.config();
const app = express();
const allowedOrigins = [
  'http://localhost:4005',
  'http://52.25.19.40:4005',
  'https://smartgrowthassets.com',
  'https://www.smartgrowthassets.com'
];

// Configure CORS: allow any origin in development, restrict to allowedOrigins in production
const corsOptions = {
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'authorization'],
};
if (process.env.NODE_ENV !== 'production') {
  // during development, allow all origins (e.g. CRA proxy or direct frontend)
  corsOptions.origin = true;
} else {
  corsOptions.origin = (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  };
}
app.use(cors(corsOptions));
app.use(express.json());
// Authentication setup
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET environment variable is required for authentication.');
  process.exit(1);
}

// Debug logging: report all incoming requests to aid troubleshooting 404s
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/investments', authenticate, investmentRoutes);
app.use('/api/btc', authenticate, btcRoutes);
app.use('/api/wallets', authenticate, walletRoutes);
app.use('/api/etf', etfRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/news', newsRoutes);

const PORT = process.env.PORT || 4004; // Changed to 4004 to match React component
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
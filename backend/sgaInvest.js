import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import investmentRoutes from './routes/investmentRoutes.js';
import btcRoutes from './routes/btcRoutes.js';
import etfRoutes from './routes/etfRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { authenticate } from './middleware/authMiddleware.js';


dotenv.config();
const app = express();
const allowedOrigins = [
  'http://localhost:4005',
  'http://52.25.19.40:4005'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
// Authentication setup
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET environment variable is required for authentication.');
  process.exit(1);
}

app.use('/api/auth', authRoutes);
app.use('/api/investments', authenticate, investmentRoutes);
app.use('/api/btc', authenticate, btcRoutes);
app.use('/api/etf', etfRoutes);

const PORT = process.env.PORT || 4004; // Changed to 4004 to match React component
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
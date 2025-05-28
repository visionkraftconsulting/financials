import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import investmentRoutes from './routes/investmentRoutes.js';
import btcRoutes from './routes/btcRoutes.js';
import etfRoutes from './routes/etfRoutes.js';


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
app.use('/api/investments', investmentRoutes);
app.use('/api/btc', btcRoutes);
app.use('/api/etf', etfRoutes);

const PORT = process.env.PORT || 4004; // Changed to 4004 to match React component
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
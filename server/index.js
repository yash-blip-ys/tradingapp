const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const axios = require('axios');
const authRoutes = require('./routes/auth');
const marketRoutes = require('./routes/market');
const portfolioRoutes = require('./routes/portfolio');
const orderRoutes = require('./routes/orders');
const algorithmRoutes = require('./routes/algorithms');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Expanded live crypto market data endpoint for multiple assets
app.get('/api/market/crypto', async (req, res) => {
  try {
    let assetList = req.query.assets;
    if (!assetList || assetList.trim() === '') {
      assetList = 'bitcoin,ethereum,solana,cardano,dogecoin,binancecoin,polkadot,tron,polygon,litecoin';
    }
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: assetList,
        vs_currencies: 'usd',
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

// New endpoint for historical price data (for chart)
app.get('/api/market/crypto/history', async (req, res) => {
  let { asset = 'bitcoin', days = 1 } = req.query;
  if (!asset || asset.trim() === '') asset = 'bitcoin';
  try {
    const params = {
      vs_currency: 'usd',
      days,
    };
    // Only add interval if days >= 2
    if (parseInt(days) >= 2) {
      params.interval = 'hourly';
    }
    const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${asset}/market_chart`, {
      params,
    });
    const prices = response.data.prices;
    const chartData = prices.map(([timestamp, price]) => ({
      x: new Date(timestamp),
      y: price,
    }));
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/algorithms', algorithmRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 
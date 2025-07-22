const express = require('express');
const axios = require('axios');
const router = express.Router();

// List of supported assets (CoinGecko IDs)
const SUPPORTED_ASSETS = [
  'bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin',
  'binancecoin', 'polkadot', 'tron', 'polygon', 'litecoin'
];

// GET /api/market/crypto?assets=bitcoin,ethereum
router.get('/crypto', async (req, res) => {
  let assets = req.query.assets ? req.query.assets.split(',') : SUPPORTED_ASSETS;
  assets = assets.filter(a => SUPPORTED_ASSETS.includes(a));
  if (assets.length === 0) assets = SUPPORTED_ASSETS;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${assets.join(',')}&vs_currencies=usd`;
    const response = await axios.get(url);
    res.json({ prices: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// GET /api/market/crypto/history?asset=bitcoin&days=1
router.get('/crypto/history', async (req, res) => {
  const asset = req.query.asset;
  const days = req.query.days || 1;
  if (!asset || !SUPPORTED_ASSETS.includes(asset)) {
    return res.status(400).json({ error: 'Invalid asset' });
  }
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${asset}/market_chart?vs_currency=usd&days=${days}`;
    const response = await axios.get(url);
    res.json({ prices: response.data.prices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

module.exports = router; 
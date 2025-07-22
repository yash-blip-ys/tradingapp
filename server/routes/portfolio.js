const express = require('express');
const { Portfolio, Watchlist, RiskSetting } = require('../models/Portfolio');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Get portfolio with analytics
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const userPortfolio = await Portfolio.find({ userId });
    // Calculate analytics
    const analytics = {
      totalHoldings: userPortfolio.length,
      totalValue: 0,
      totalPnl: 0,
      bestPerformer: null,
      worstPerformer: null
    };
    // Add current prices and calculate P&L (dummy data for now)
    const portfolioWithPrices = userPortfolio.map(holding => {
      const currentPrice = getCurrentPrice(holding.asset); // Dummy function
      const currentValue = holding.quantity * currentPrice;
      const costBasis = holding.quantity * holding.avgBuyPrice;
      const pnl = currentValue - costBasis;
      const pnlPercentage = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      analytics.totalValue += currentValue;
      analytics.totalPnl += pnl;
      return {
        ...holding.toObject(),
        currentPrice,
        currentValue,
        costBasis,
        pnl,
        pnlPercentage
      };
    });
    // Find best/worst performers
    if (portfolioWithPrices.length > 0) {
      portfolioWithPrices.sort((a, b) => b.pnlPercentage - a.pnlPercentage);
      analytics.bestPerformer = portfolioWithPrices[0];
      analytics.worstPerformer = portfolioWithPrices[portfolioWithPrices.length - 1];
    }
    // Watchlist
    const watchlistDoc = await Watchlist.findOne({ userId });
    const watchlist = watchlistDoc ? watchlistDoc.assets : [];
    // Risk settings
    const riskSettingsDoc = await RiskSetting.findOne({ userId });
    const riskSettings = riskSettingsDoc || {};
    res.json({
      portfolio: portfolioWithPrices,
      analytics,
      watchlist,
      riskSettings
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch portfolio' });
  }
});

// Update watchlist
router.post('/watchlist', auth, async (req, res) => {
  const userId = req.user.id;
  const { action, asset } = req.body;
  if (!['add', 'remove'].includes(action) || !asset) {
    return res.status(400).json({ message: 'Invalid parameters' });
  }
  try {
    let watchlistDoc = await Watchlist.findOne({ userId });
    if (!watchlistDoc) {
      watchlistDoc = await Watchlist.create({ userId, assets: [] });
    }
    if (action === 'add') {
      if (!watchlistDoc.assets.includes(asset)) {
        watchlistDoc.assets.push(asset);
      }
    } else if (action === 'remove') {
      watchlistDoc.assets = watchlistDoc.assets.filter(a => a !== asset);
    }
    await watchlistDoc.save();
    res.json({ success: true, watchlist: watchlistDoc.assets });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update watchlist' });
  }
});

// Update risk settings
router.post('/risk-settings', auth, async (req, res) => {
  const userId = req.user.id;
  const { maxPositionSize, maxDailyLoss, stopLossPercentage } = req.body;
  try {
    let riskSettingsDoc = await RiskSetting.findOne({ userId });
    if (!riskSettingsDoc) {
      riskSettingsDoc = await RiskSetting.create({ userId });
    }
    if (maxPositionSize !== undefined) riskSettingsDoc.maxPositionSize = maxPositionSize;
    if (maxDailyLoss !== undefined) riskSettingsDoc.maxDailyLoss = maxDailyLoss;
    if (stopLossPercentage !== undefined) riskSettingsDoc.stopLossPercentage = stopLossPercentage;
    await riskSettingsDoc.save();
    res.json({ success: true, riskSettings: riskSettingsDoc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update risk settings' });
  }
});

// Get portfolio performance over time (dummy data)
router.get('/performance', auth, (req, res) => {
  const { period = '7d' } = req.query;
  // Dummy performance data
  const performance = generatePerformanceData(period);
  res.json({ performance });
});

// Helper function to get current price (dummy implementation)
function getCurrentPrice(asset) {
  const prices = {
    bitcoin: 108000,
    ethereum: 3200,
    solana: 140,
    cardano: 0.45,
    dogecoin: 0.08,
    binancecoin: 580,
    polkadot: 6.5,
    tron: 0.12,
    polygon: 0.85,
    litecoin: 68
  };
  return prices[asset] || 100;
}

// Helper function to generate performance data
function generatePerformanceData(period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 7;
  const data = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: 10000 + Math.random() * 2000 - 1000, // Random variation
      pnl: Math.random() * 500 - 250
    });
  }
  return data;
}

module.exports = router; 
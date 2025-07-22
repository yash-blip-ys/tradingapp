const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  asset: { type: String, required: true },
  quantity: { type: Number, required: true },
  avgBuyPrice: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

const watchlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assets: [{ type: String }]
}, { timestamps: true });

const riskSettingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxPositionSize: { type: Number, default: 1000 },
  maxDailyLoss: { type: Number, default: 100 },
  stopLossPercentage: { type: Number, default: 5 }
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
const Watchlist = mongoose.model('Watchlist', watchlistSchema);
const RiskSetting = mongoose.model('RiskSetting', riskSettingSchema);

module.exports = { Portfolio, Watchlist, RiskSetting }; 
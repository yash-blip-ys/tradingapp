const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  asset: { type: String, required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  orderType: { type: String, enum: ['market', 'limit', 'stop'], default: 'market' },
  stopLoss: { type: Number, default: null },
  takeProfit: { type: Number, default: null },
  algorithm: { type: String, default: null },
  status: { type: String, enum: ['executed', 'pending', 'cancelled'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
  executedPrice: { type: Number, default: null }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 
const express = require('express');
const Order = require('../models/Order');
const { Portfolio } = require('../models/Portfolio');
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

// Get order history with filtering
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const { status, type, asset, limit = 50 } = req.query;
  const filter = { userId };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (asset) filter.asset = asset;
  try {
    const orders = await Order.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Place advanced order
router.post('/', auth, async (req, res) => {
  const userId = req.user.id;
  const {
    type, asset, amount, price, orderType = 'market',
    stopLoss, takeProfit, algorithm
  } = req.body;
  if (!['buy', 'sell'].includes(type) || !asset || !amount || !price) {
    return res.status(400).json({ message: 'Invalid order parameters' });
  }
  if (!['market', 'limit', 'stop'].includes(orderType)) {
    return res.status(400).json({ message: 'Invalid order type' });
  }
  try {
    const orderData = {
      userId,
      type,
      asset,
      amount: Number(amount),
      price: Number(price),
      orderType,
      stopLoss: stopLoss ? Number(stopLoss) : null,
      takeProfit: takeProfit ? Number(takeProfit) : null,
      algorithm: algorithm || null,
      status: orderType === 'market' ? 'executed' : 'pending',
      timestamp: Date.now(),
      executedPrice: orderType === 'market' ? Number(price) : null
    };
    // For market orders, update portfolio immediately
    if (orderType === 'market') {
      const result = await executeOrder(userId, orderData);
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
    }
    const order = await Order.create(orderData);
    res.json({
      success: true,
      orderId: order._id,
      message: orderType === 'market' ? 'Order executed' : 'Order placed'
    });
  } catch (err) {
    res.status(500).json({ message: 'Order failed' });
  }
});

// Cancel order
router.delete('/:orderId', auth, async (req, res) => {
  const userId = req.user.id;
  const orderId = req.params.orderId;
  try {
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel executed order' });
    }
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Cancel failed' });
  }
});

// Execute market order: update portfolio
async function executeOrder(userId, order) {
  try {
    let holding = await Portfolio.findOne({ userId, asset: order.asset });
    if (order.type === 'buy') {
      if (!holding) {
        holding = await Portfolio.create({
          userId,
          asset: order.asset,
          quantity: order.amount,
          avgBuyPrice: order.executedPrice,
          lastUpdated: Date.now()
        });
      } else {
        // Weighted average price
        const totalCost = holding.quantity * holding.avgBuyPrice + order.amount * order.executedPrice;
        holding.quantity += order.amount;
        holding.avgBuyPrice = holding.quantity ? totalCost / holding.quantity : order.executedPrice;
        holding.lastUpdated = Date.now();
        await holding.save();
      }
    } else if (order.type === 'sell') {
      if (!holding || holding.quantity < order.amount) {
        return { success: false, message: 'Not enough holdings' };
      }
      holding.quantity -= order.amount;
      holding.lastUpdated = Date.now();
      if (holding.quantity === 0) {
        await Portfolio.deleteOne({ _id: holding._id });
      } else {
        await holding.save();
      }
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: 'Portfolio update failed' };
  }
}

module.exports = router; 
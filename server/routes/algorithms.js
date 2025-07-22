const express = require('express');
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

// Get available algorithms
router.get('/', auth, (req, res) => {
  const algorithms = [
    {
      id: 'sma_crossover',
      name: 'SMA Crossover',
      description: 'Buy when short SMA crosses above long SMA, sell when it crosses below',
      parameters: [
        { name: 'shortPeriod', type: 'number', default: 10, min: 5, max: 50 },
        { name: 'longPeriod', type: 'number', default: 20, min: 10, max: 200 }
      ]
    },
    {
      id: 'rsi',
      name: 'RSI Strategy',
      description: 'Buy when RSI is oversold (< 30), sell when overbought (> 70)',
      parameters: [
        { name: 'period', type: 'number', default: 14, min: 5, max: 50 },
        { name: 'oversold', type: 'number', default: 30, min: 10, max: 40 },
        { name: 'overbought', type: 'number', default: 70, min: 60, max: 90 }
      ]
    },
    {
      id: 'macd',
      name: 'MACD Strategy',
      description: 'Buy when MACD line crosses above signal line, sell when it crosses below',
      parameters: [
        { name: 'fastPeriod', type: 'number', default: 12, min: 5, max: 50 },
        { name: 'slowPeriod', type: 'number', default: 26, min: 10, max: 100 },
        { name: 'signalPeriod', type: 'number', default: 9, min: 5, max: 20 }
      ]
    },
    {
      id: 'bollinger_bands',
      name: 'Bollinger Bands',
      description: 'Buy when price touches lower band, sell when it touches upper band',
      parameters: [
        { name: 'period', type: 'number', default: 20, min: 10, max: 50 },
        { name: 'stdDev', type: 'number', default: 2, min: 1, max: 3 }
      ]
    }
  ];
  
  res.json({ algorithms });
});

// Get algorithm signals for an asset
router.post('/signals', auth, (req, res) => {
  const { algorithm, asset, parameters } = req.body;
  
  if (!algorithm || !asset) {
    return res.status(400).json({ message: 'Algorithm and asset required' });
  }
  
  // Generate dummy signals based on algorithm
  const signals = generateSignals(algorithm, asset, parameters);
  
  res.json({ signals });
});

// Backtest algorithm
router.post('/backtest', auth, (req, res) => {
  const { algorithm, asset, parameters, startDate, endDate, initialCapital } = req.body;
  
  if (!algorithm || !asset || !startDate || !endDate || !initialCapital) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }
  
  // Generate dummy backtest results
  const results = generateBacktestResults(algorithm, asset, parameters, startDate, endDate, initialCapital);
  
  res.json({ results });
});

// Helper function to generate signals
function generateSignals(algorithm, asset, parameters) {
  const signals = [];
  const currentPrice = getCurrentPrice(asset);
  
  switch (algorithm) {
    case 'sma_crossover':
      const shortSMA = currentPrice * (0.98 + Math.random() * 0.04);
      const longSMA = currentPrice * (0.97 + Math.random() * 0.06);
      signals.push({
        type: shortSMA > longSMA ? 'buy' : 'sell',
        price: currentPrice,
        strength: Math.abs(shortSMA - longSMA) / currentPrice,
        timestamp: Date.now(),
        indicator: `SMA(${parameters?.shortPeriod || 10}) vs SMA(${parameters?.longPeriod || 20})`
      });
      break;
      
    case 'rsi':
      const rsi = 30 + Math.random() * 40; // Random RSI between 30-70
      signals.push({
        type: rsi < (parameters?.oversold || 30) ? 'buy' : rsi > (parameters?.overbought || 70) ? 'sell' : 'hold',
        price: currentPrice,
        strength: Math.abs(rsi - 50) / 50,
        timestamp: Date.now(),
        indicator: `RSI(${parameters?.period || 14}): ${rsi.toFixed(2)}`
      });
      break;
      
    case 'macd':
      const macd = (Math.random() - 0.5) * 100;
      const signal = (Math.random() - 0.5) * 100;
      signals.push({
        type: macd > signal ? 'buy' : 'sell',
        price: currentPrice,
        strength: Math.abs(macd - signal) / 100,
        timestamp: Date.now(),
        indicator: `MACD: ${macd.toFixed(2)}, Signal: ${signal.toFixed(2)}`
      });
      break;
      
    case 'bollinger_bands':
      const upperBand = currentPrice * 1.05;
      const lowerBand = currentPrice * 0.95;
      const position = (currentPrice - lowerBand) / (upperBand - lowerBand);
      signals.push({
        type: position < 0.2 ? 'buy' : position > 0.8 ? 'sell' : 'hold',
        price: currentPrice,
        strength: Math.abs(position - 0.5) * 2,
        timestamp: Date.now(),
        indicator: `BB Position: ${(position * 100).toFixed(1)}%`
      });
      break;
  }
  
  return signals;
}

// Helper function to generate backtest results
function generateBacktestResults(algorithm, asset, parameters, startDate, endDate, initialCapital) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const trades = [];
  let capital = initialCapital;
  let shares = 0;
  
  for (let i = 0; i < days; i++) {
    const signal = generateSignals(algorithm, asset, parameters)[0];
    const price = signal.price * (0.95 + Math.random() * 0.1); // Price variation
    
    if (signal.type === 'buy' && capital > 0) {
      const buyAmount = Math.min(capital, 1000); // Max $1000 per trade
      const buyShares = buyAmount / price;
      shares += buyShares;
      capital -= buyAmount;
      trades.push({
        date: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'buy',
        price,
        shares: buyShares,
        value: buyAmount
      });
    } else if (signal.type === 'sell' && shares > 0) {
      const sellShares = Math.min(shares, 10); // Max 10 shares per trade
      const sellValue = sellShares * price;
      shares -= sellShares;
      capital += sellValue;
      trades.push({
        date: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'sell',
        price,
        shares: sellShares,
        value: sellValue
      });
    }
  }
  
  const finalValue = capital + (shares * getCurrentPrice(asset));
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
  
  return {
    initialCapital,
    finalValue,
    totalReturn,
    trades,
    metrics: {
      totalTrades: trades.length,
      winningTrades: trades.filter(t => t.type === 'sell' && t.value > 1000).length,
      maxDrawdown: Math.random() * 20, // Dummy max drawdown
      sharpeRatio: 1.5 + Math.random() * 1 // Dummy Sharpe ratio
    }
  };
}

// Helper function to get current price
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

module.exports = router; 
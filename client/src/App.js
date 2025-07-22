import React, { useEffect, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import Orders from './components/Orders';
import AdvancedOrderForm from './components/AdvancedOrderForm';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import TradingAlgorithms from './components/TradingAlgorithms';
import EnhancedOrderHistory from './components/EnhancedOrderHistory';
import './App.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'tron', symbol: 'TRX', name: 'Tron' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
];

function App() {
  const [prices, setPrices] = useState({});
  const [selected, setSelected] = useState(ASSETS[0].id);
  const [history, setHistory] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('market');
  const [portfolio, setPortfolio] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderForm, setOrderForm] = useState({ asset: '', amount: '', price: '', type: 'buy' });
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch all asset prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = ASSETS.map(a => a.id).join(',');
        const res = await fetch(`/api/market/crypto?assets=${ids}`);
        if (!res.ok) throw new Error('Failed to fetch prices');
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.error('Could not load market data', err);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch price history for selected asset
  useEffect(() => {
    let cancelled = false;
    const fetchHistory = async () => {
      try {
        setChartLoading(true);
        setHistory(null);
        const res = await fetch(`/api/market/crypto/history?asset=${selected}&days=1`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const data = await res.json();
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setHistory({ error: 'Chart unavailable (API error or rate limit)' });
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    };
    // Debounce rapid asset switching
    const timeout = setTimeout(fetchHistory, 200);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [selected]);

  const selectedAsset = ASSETS.find(a => a.id === selected);
  const selectedPrice = prices[selected]?.usd;

  // Prepare chart data
  let chartData = null;
  if (history && history.prices && Array.isArray(history.prices) && history.prices.length > 0) {
    // Support both [timestamp, price] and {x, y} formats for robustness
    const isArrayFormat = Array.isArray(history.prices[0]);
    chartData = {
      labels: history.prices.map(p => {
        const ts = isArrayFormat ? p[0] : p.x;
        const d = new Date(ts);
        return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
      }),
      datasets: [
        {
          label: `${selectedAsset.name} Price (USD)`,
          data: history.prices.map(p => isArrayFormat ? p[1] : p.y),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.08)',
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
        },
      ],
    };
  }

  // Handle login/logout
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  // On mount, check for token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // You could verify the token here
    }
  }, []);

  // Fetch portfolio
  const fetchPortfolio = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setPortfolio(data.portfolio || []);
    } catch {
      setPortfolio([]);
    }
  }, [user]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  }, [user]);

  // Fetch on login/page change
  useEffect(() => {
    if (user && page === 'portfolio') fetchPortfolio();
    if (user && page === 'orders') fetchOrders();
  }, [user, page, fetchPortfolio, fetchOrders]);

  // Handle order form submit
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
      setOrderError('You must be logged in to place an order.');
      return;
    }
    setOrderLoading(true);
    setOrderError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          type: orderForm.type,
          asset: orderForm.asset,
          amount: Number(orderForm.amount),
          price: Number(orderForm.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order failed');
      setOrderForm({ asset: '', amount: '', price: '', type: 'buy' });
      fetchPortfolio();
      fetchOrders();
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-black">
        {/* Navigation */}
        <nav className="glass shadow-lg flex items-center justify-between px-8 py-3 mt-4 mx-auto max-w-7xl">
          <h1 className="text-2xl font-extrabold gradient-text neon">Trading App</h1>
          <div className="flex items-center space-x-4">
            <Link to="/" className="gradient-text font-semibold">Dashboard</Link>
            <Link to="/portfolio" className="gradient-text font-semibold">Portfolio</Link>
            <Link to="/orders" className="gradient-text font-semibold">Orders</Link>
            <Link to="/algorithms" className="gradient-text font-semibold">Algorithms</Link>
            <button onClick={() => setDarkMode(dm => !dm)} className="btn-gradient px-3 py-2 rounded-md text-sm font-medium" title="Toggle dark mode">{darkMode ? '��' : '☀️'}</button>
            <button onClick={handleLogout} className="btn-gradient px-4 py-2 rounded-md font-bold">Logout</button>
          </div>
        </nav>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-8 px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/algorithms" element={<TradingAlgorithms />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

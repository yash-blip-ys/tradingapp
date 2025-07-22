import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import AdvancedOrderForm from './AdvancedOrderForm';

const Dashboard = () => {
  const [prices, setPrices] = useState({});
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [history, setHistory] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  const ASSETS = [
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
    { id: 'solana', name: 'Solana', symbol: 'SOL' },
    { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
    { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
    { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
    { id: 'tron', name: 'TRON', symbol: 'TRX' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC' },
    { id: 'litecoin', name: 'Litecoin', symbol: 'LTC' }
  ];

  useEffect(() => {
    fetchPrices();
    fetchPortfolio();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      fetchHistory();
    }
  }, [selectedAsset]);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/market/crypto');
      const data = await response.json();
      setPrices(data.prices);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/market/crypto/history?asset=${selectedAsset}&days=1`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPortfolio(data.portfolio);
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const handleOrderSubmit = async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (data.success) {
        alert('Order placed successfully!');
        fetchPortfolio(); // Refresh portfolio
      } else {
        alert('Error placing order: ' + data.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
  };

  const safePrices = prices || {};
  const selectedPrice = safePrices[selectedAsset] && safePrices[selectedAsset].usd !== undefined
    ? safePrices[selectedAsset].usd
    : null;
  const selectedAssetData = ASSETS.find(a => a.id === selectedAsset);

  const chartData = history?.prices ? {
    labels: history.prices.map(p => new Date(p[0]).toLocaleTimeString()),
    datasets: [{
      label: 'Price',
      data: history.prices.map(p => p[1]),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0, 0, 0, 0.1)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Portfolio Value</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${analytics?.totalValue?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
          <p className={`text-2xl font-bold ${analytics?.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics?.totalPnl >= 0 ? '+' : ''}${analytics?.totalPnl?.toFixed(2) || '0'}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Holdings</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analytics?.totalHoldings || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Best Performer</h3>
          <p className="text-lg font-semibold text-green-600">
            {analytics?.bestPerformer?.asset || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Selection */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {ASSETS.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedAsset === asset.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{asset.symbol}</div>
                  <div className="text-xs">
                    {safePrices[asset.id] && safePrices[asset.id].usd !== undefined
                      ? `$${safePrices[asset.id].usd.toFixed(2)}`
                      : '--'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedAssetData?.name} ({selectedAssetData?.symbol})
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedPrice !== null ? `$${selectedPrice.toLocaleString()}` : '--'}
              </div>
            </div>
            {chartData && (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* Advanced Order Form */}
        <div className="lg:col-span-1">
          <AdvancedOrderForm
            selectedAsset={selectedAsset}
            currentPrice={selectedPrice}
            onOrderSubmit={handleOrderSubmit}
          />
        </div>
      </div>

      {/* Recent Holdings */}
      {portfolio.length > 0 && (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Holdings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.slice(0, 6).map((holding, index) => (
              <div key={index} className="p-4 border border-zinc-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {holding.asset.charAt(0).toUpperCase() + holding.asset.slice(1)}
                  </h4>
                  <span className={`text-sm font-medium ${
                    holding.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {holding.pnlPercentage >= 0 ? '+' : ''}{holding.pnlPercentage?.toFixed(2) || '0'}%
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {holding.quantity.toFixed(4)} @ ${holding.avgBuyPrice.toFixed(2)}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  ${holding.currentValue?.toFixed(2) || '0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
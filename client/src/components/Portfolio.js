import React, { useState, useEffect } from 'react';
import PortfolioAnalytics from './PortfolioAnalytics';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPortfolio(data.portfolio);
      setAnalytics(data.analytics);
      setWatchlist(data.watchlist);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setLoading(false);
    }
  };

  const addToWatchlist = async (asset) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolio/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'add', asset })
      });
      const data = await response.json();
      setWatchlist(data.watchlist);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    }
  };

  const removeFromWatchlist = async (asset) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/portfolio/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'remove', asset })
      });
      const data = await response.json();
      setWatchlist(data.watchlist);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Analytics */}
      <PortfolioAnalytics portfolio={portfolio} analytics={analytics} />

      {/* Watchlist */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 gradient-text neon">Watchlist</h3>
        {watchlist.length === 0 ? (
          <p className="text-gray-400">No assets in watchlist. Add some to track your favorite cryptocurrencies.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {watchlist.map((asset, index) => (
              <div key={index} className="p-4 border border-zinc-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-100">
                    {asset.charAt(0).toUpperCase() + asset.slice(1)}
                  </h4>
                  <button
                    onClick={() => removeFromWatchlist(asset)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 gradient-text neon">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <h4 className="font-medium text-blue-900">Trade</h4>
            <p className="text-sm text-blue-600">Place new orders</p>
          </button>
          <button
            onClick={() => window.location.href = '/orders'}
            className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
          >
            <h4 className="font-medium text-green-900">Orders</h4>
            <p className="text-sm text-green-600">View order history</p>
          </button>
          <button
            onClick={() => window.location.href = '/algorithms'}
            className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <h4 className="font-medium text-purple-900">Algorithms</h4>
            <p className="text-sm text-purple-600">Trading strategies</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portfolio; 
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const PortfolioAnalytics = ({ portfolio, analytics }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: 1000,
    maxDailyLoss: 100,
    stopLossPercentage: 5
  });

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/portfolio/performance?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setPerformanceData(data.performance);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const updateRiskSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/portfolio/risk-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(riskSettings)
      });
    } catch (error) {
      console.error('Error updating risk settings:', error);
    }
  };

  const chartData = performanceData ? {
    labels: performanceData.map(d => d.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: performanceData.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-2xl font-bold text-gray-100">
            ${analytics?.totalValue?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="glass p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total P&L</h3>
          <p className={`text-2xl font-bold ${analytics?.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analytics?.totalPnl >= 0 ? '+' : ''}${analytics?.totalPnl?.toFixed(2) || '0'}
          </p>
        </div>
        <div className="glass p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Holdings</h3>
          <p className="text-2xl font-bold text-gray-100">
            {analytics?.totalHoldings || 0}
          </p>
        </div>
        <div className="glass p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Best Performer</h3>
          <p className="text-lg font-semibold text-green-600">
            {analytics?.bestPerformer?.asset || 'N/A'}
          </p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="glass p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Performance</h3>
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        {chartData && (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      {/* Holdings Breakdown */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Holdings Breakdown</h3>
        <div className="space-y-3">
          {portfolio?.map(holding => (
            <div key={holding.asset} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-100">{holding.asset}</p>
                <p className="text-sm text-gray-400">
                  {holding.quantity.toFixed(4)} @ ${holding.avgBuyPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-100">
                  ${holding.currentValue?.toFixed(2) || '0'}
                </p>
                <p className={`text-sm ${holding.pnlPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {holding.pnlPercentage >= 0 ? '+' : ''}{holding.pnlPercentage?.toFixed(2) || '0'}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Position Size ($)
            </label>
            <input
              type="number"
              value={riskSettings.maxPositionSize}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxPositionSize: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Daily Loss ($)
            </label>
            <input
              type="number"
              value={riskSettings.maxDailyLoss}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                maxDailyLoss: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stop Loss (%)
            </label>
            <input
              type="number"
              value={riskSettings.stopLossPercentage}
              onChange={(e) => setRiskSettings(prev => ({
                ...prev,
                stopLossPercentage: parseFloat(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={updateRiskSettings}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Risk Settings
        </button>
      </div>
    </div>
  );
};

export default PortfolioAnalytics; 
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const TradingAlgorithms = () => {
  const [algorithms, setAlgorithms] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [parameters, setParameters] = useState({});
  const [signals, setSignals] = useState([]);
  const [backtestResults, setBacktestResults] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const assets = [
    'bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin',
    'binancecoin', 'polkadot', 'tron', 'polygon', 'litecoin'
  ];

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  useEffect(() => {
    if (selectedAlgorithm && selectedAsset) {
      fetchSignals();
    }
  }, [selectedAlgorithm, selectedAsset, parameters]);

  const fetchAlgorithms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/algorithms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAlgorithms(data.algorithms);
    } catch (error) {
      console.error('Error fetching algorithms:', error);
    }
  };

  const fetchSignals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/algorithms/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          asset: selectedAsset,
          parameters
        })
      });
      const data = await response.json();
      setSignals(data.signals);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const runBacktest = async () => {
    if (!selectedAlgorithm || !selectedAsset) return;

    setIsBacktesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/algorithms/backtest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          algorithm: selectedAlgorithm,
          asset: selectedAsset,
          parameters,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          initialCapital: 10000
        })
      });
      const data = await response.json();
      setBacktestResults(data.results);
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleAlgorithmSelect = (algoId) => {
    setSelectedAlgorithm(algoId);
    const algo = algorithms.find(a => a.id === algoId);
    if (algo) {
      const params = {};
      algo.parameters.forEach(param => {
        params[param.name] = param.default;
      });
      setParameters(params);
    }
  };

  const updateParameter = (paramName, value) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: parseFloat(value)
    }));
  };

  const backtestChartData = backtestResults ? {
    labels: backtestResults.trades.map(t => t.date),
    datasets: [
      {
        label: 'Trade Value',
        data: backtestResults.trades.map(t => t.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
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
      {/* Algorithm Selection */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 gradient-text neon">Trading Algorithms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Algorithm List */}
          <div>
            <h4 className="text-md font-medium mb-3">Available Algorithms</h4>
            <div className="space-y-2">
              {algorithms.map(algo => (
                <div
                  key={algo.id}
                  onClick={() => handleAlgorithmSelect(algo.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAlgorithm === algo.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300'
                  }`}
                >
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">{algo.name}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{algo.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Selection */}
          <div>
            <h4 className="text-md font-medium mb-3">Asset Selection</h4>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assets.map(asset => (
                <option key={asset} value={asset}>
                  {asset.charAt(0).toUpperCase() + asset.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Algorithm Parameters */}
      {selectedAlgorithm && (
        <div className="glass p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 gradient-text neon">Algorithm Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {algorithms
              .find(a => a.id === selectedAlgorithm)
              ?.parameters.map(param => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {param.name}
                  </label>
                  <input
                    type="number"
                    value={parameters[param.name] || param.default}
                    onChange={(e) => updateParameter(param.name, e.target.value)}
                    min={param.min}
                    max={param.max}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Current Signals */}
      {signals.length > 0 && (
        <div className="glass p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 gradient-text neon">Current Signals</h3>
          <div className="space-y-3">
            {signals.map((signal, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{signal.indicator}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Price: ${signal.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    signal.type === 'buy' ? 'bg-green-100 text-green-800' :
                    signal.type === 'sell' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {signal.type.toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Strength: {(signal.strength * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backtesting */}
      <div className="glass p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold gradient-text neon">Backtesting</h3>
          <button
            onClick={runBacktest}
            disabled={!selectedAlgorithm || isBacktesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 btn-gradient"
          >
            {isBacktesting ? 'Running...' : 'Run Backtest'}
          </button>
        </div>

        {backtestResults && (
          <div className="space-y-4">
            {/* Backtest Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Initial Capital</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">${backtestResults.initialCapital.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Final Value</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">${backtestResults.finalValue.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Return</p>
                <p className={`text-lg font-semibold ${backtestResults.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {backtestResults.totalReturn >= 0 ? '+' : ''}{backtestResults.totalReturn.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{backtestResults.metrics.totalTrades}</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {backtestResults.metrics.totalTrades > 0 
                    ? ((backtestResults.metrics.winningTrades / backtestResults.metrics.totalTrades) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Max Drawdown</p>
                <p className="text-lg font-semibold text-red-600">
                  {backtestResults.metrics.maxDrawdown.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sharpe Ratio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {backtestResults.metrics.sharpeRatio.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Trade Chart */}
            {backtestChartData && (
              <div className="h-64">
                <Line data={backtestChartData} options={chartOptions} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingAlgorithms; 
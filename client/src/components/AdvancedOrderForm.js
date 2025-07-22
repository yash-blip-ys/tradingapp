import React, { useState, useEffect } from 'react';

const AdvancedOrderForm = ({ selectedAsset, currentPrice, onOrderSubmit }) => {
  const [orderType, setOrderType] = useState('market');
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [algorithm, setAlgorithm] = useState('');
  const [algorithms, setAlgorithms] = useState([]);
  const [algorithmParams, setAlgorithmParams] = useState({});
  const [signals, setSignals] = useState([]);

  useEffect(() => {
    if (currentPrice) {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice]);

  useEffect(() => {
    fetchAlgorithms();
  }, []);

  useEffect(() => {
    if (algorithm && selectedAsset) {
      fetchSignals();
    }
  }, [algorithm, selectedAsset, algorithmParams]);

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
          algorithm,
          asset: selectedAsset,
          parameters: algorithmParams
        })
      });
      const data = await response.json();
      setSignals(data.signals);
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderData = {
      type,
      asset: selectedAsset,
      amount: parseFloat(amount),
      price: parseFloat(price),
      orderType,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      algorithm: algorithm || null
    };
    onOrderSubmit(orderData);
  };

  const handleAlgorithmChange = (algoId) => {
    setAlgorithm(algoId);
    const selectedAlgo = algorithms.find(a => a.id === algoId);
    if (selectedAlgo) {
      const params = {};
      selectedAlgo.parameters.forEach(param => {
        params[param.name] = param.default;
      });
      setAlgorithmParams(params);
    }
  };

  const updateAlgorithmParam = (paramName, value) => {
    setAlgorithmParams(prev => ({
      ...prev,
      [paramName]: parseFloat(value)
    }));
  };

  return (
    <div className="glass rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-100 gradient-text neon">Advanced Order</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Order Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['market', 'limit', 'stop'].map(ot => (
              <button
                key={ot}
                type="button"
                onClick={() => setOrderType(ot)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  orderType === ot
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-200 hover:bg-gray-200'
                }`}
              >
                {ot.charAt(0).toUpperCase() + ot.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Buy/Sell Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['buy', 'sell'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  type === t
                    ? t === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-200 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Amount and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Stop Loss and Take Profit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Stop Loss
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Take Profit
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
              step="0.01"
            />
          </div>
        </div>

        {/* Trading Algorithm */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Trading Algorithm (Optional)
          </label>
          <select
            value={algorithm}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No Algorithm</option>
            {algorithms.map(algo => (
              <option key={algo.id} value={algo.id}>
                {algo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm Parameters */}
        {algorithm && (
          <div className="bg-gray-50 dark:bg-zinc-700 p-4 rounded-md">
            <h4 className="text-sm font-medium text-gray-200 mb-3">Algorithm Parameters</h4>
            <div className="grid grid-cols-2 gap-3">
              {algorithms
                .find(a => a.id === algorithm)
                ?.parameters.map(param => (
                  <div key={param.name}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      {param.name}
                    </label>
                    <input
                      type="number"
                      value={algorithmParams[param.name] || param.default}
                      onChange={(e) => updateAlgorithmParam(param.name, e.target.value)}
                      min={param.min}
                      max={param.max}
                      className="w-full px-2 py-1 text-sm border border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Algorithm Signals */}
        {signals.length > 0 && (
          <div className="bg-blue-50 dark:bg-zinc-700 p-4 rounded-md">
            <h4 className="text-sm font-medium text-blue-700 mb-2">Algorithm Signal</h4>
            {signals.map((signal, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-blue-600">{signal.indicator}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  signal.type === 'buy' ? 'bg-green-100 text-green-800' :
                  signal.type === 'sell' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {signal.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-md font-medium text-white btn-gradient`}
        >
          Place {type.charAt(0).toUpperCase() + type.slice(1)} Order
        </button>
      </form>
    </div>
  );
};

export default AdvancedOrderForm; 
import React, { useState, useEffect } from 'react';

const EnhancedOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    asset: '',
    orderType: ''
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply filters
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter(order => order.type === filters.type);
    }
    if (filters.asset) {
      filtered = filtered.filter(order => order.asset === filters.asset);
    }
    if (filters.orderType) {
      filtered = filtered.filter(order => order.orderType === filters.orderType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  };

  const cancelOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'executed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    return type === 'buy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const assets = [...new Set(orders.map(order => order.asset))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 gradient-text neon">Order History</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="executed">Executed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <select
              value={filters.asset}
              onChange={(e) => setFilters(prev => ({ ...prev, asset: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assets</option>
              {assets.map(asset => (
                <option key={asset} value={asset}>
                  {asset.charAt(0).toUpperCase() + asset.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select
              value={filters.orderType}
              onChange={(e) => setFilters(prev => ({ ...prev, orderType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Order Types</option>
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="stop">Stop</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="timestamp">Date</option>
              <option value="price">Price</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-3 py-1 rounded text-sm ${sortOrder === 'desc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Desc
            </button>
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-3 py-1 rounded text-sm ${sortOrder === 'asc' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Asc
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(order.type)}`}>
                      {order.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.asset.charAt(0).toUpperCase() + order.asset.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.amount.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Order Details Modal (if needed) */}
      {filteredOrders.length > 0 && (
        <div className="glass p-6 rounded-lg shadow">
          <h4 className="text-md font-semibold mb-3 gradient-text neon">Advanced Order Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Orders with Stop Loss: {filteredOrders.filter(o => o.stopLoss).length}</p>
            </div>
            <div>
              <p className="text-gray-500">Orders with Take Profit: {filteredOrders.filter(o => o.takeProfit).length}</p>
            </div>
            <div>
              <p className="text-gray-500">Algorithm Orders: {filteredOrders.filter(o => o.algorithm).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedOrderHistory; 
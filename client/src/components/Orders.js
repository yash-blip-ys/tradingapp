import React, { useState } from 'react';
import EnhancedOrderHistory from './EnhancedOrderHistory';
import AdvancedOrderForm from './AdvancedOrderForm';

const Orders = () => {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('bitcoin');
  const [currentPrice, setCurrentPrice] = useState(null);

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
        setShowOrderForm(false);
        // Refresh the order history
        window.location.reload();
      } else {
        alert('Error placing order: ' + data.message);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with New Order Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <button
          onClick={() => setShowOrderForm(!showOrderForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showOrderForm ? 'Hide Order Form' : 'New Order'}
        </button>
      </div>

      {/* Advanced Order Form */}
      {showOrderForm && (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow">
          <AdvancedOrderForm
            selectedAsset={selectedAsset}
            currentPrice={currentPrice}
            onOrderSubmit={handleOrderSubmit}
          />
        </div>
      )}

      {/* Enhanced Order History */}
      <EnhancedOrderHistory />
    </div>
  );
};

export default Orders; 
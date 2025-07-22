import React, { useState } from 'react';

const Signup = ({ onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onSignup(data.token);
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Sign Up</button>
      </form>
    </div>
  );
};

export default Signup; 
'use client';
import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, loading, error } = useAuthStore();

  const handleSubmit = async () => {
    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">NexChat</h1>
          <p className="text-gray-400 text-sm">AI-Powered Messenger</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-700">
          <h2 className="text-white text-2xl font-bold mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-green-400 text-sm"
                />
              </div>
            )}

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-green-400 text-sm"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:border-green-400 text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
            </button>
          </div>

          <p className="text-gray-400 text-sm text-center mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-400 hover:underline font-medium"
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useFacilitatorAuth } from '../hooks/useAuth';

export default function FacilitatorLogin() {
  const navigate = useNavigate();
  const { login } = useFacilitatorAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/facilitators/login', { username, password });
      login(res.data.token);
      localStorage.setItem('facilitator_data', JSON.stringify(res.data.facilitator));
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50"
      dir="ltr"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Facilitator Login</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Recovery Journey Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 sm:py-3 min-h-10 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              style={{ direction: 'ltr', textAlign: 'left' }}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 text-left">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 pr-10 min-h-10 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
                style={{ direction: 'ltr', textAlign: 'left' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={!username || !password || loading}
            className="w-full bg-green-700 text-white font-medium rounded-lg px-4 py-2 sm:py-3 text-xs sm:text-sm hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition min-h-10"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          className="text-center text-xs sm:text-sm text-gray-400 mt-6 cursor-pointer hover:text-gray-600"
          onClick={() => navigate('/')}
        >
          ← Back to patient portal
        </p>
      </div>
    </div>
  );
}

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Droplets, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try { await login(email, password); navigate('/map'); } catch { }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-blood-900 to-red-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur">
            <Droplets className="w-9 h-9 text-red-300 animate-heartbeat" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/60 mt-1">Sign in to LifeFlow</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-7">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => { clearError(); setEmail(e.target.value); }}
                placeholder="your@email.com" className="input-field" required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => { clearError(); setPassword(e.target.value); }}
                placeholder="••••••••" className="input-field" required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2">
              {isLoading ? <><div className="spinner w-4 h-4" /> Signing in...</> : '🩸 Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-5">
            No account? <Link to="/signup" className="text-blood-700 font-bold hover:text-blood-800">Register here</Link>
          </p>
        </div>
        <p className="text-center mt-4">
          <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleDemoLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }

    try {
      setError('');
      setLoading(true);
      const res = await login(email.trim(), password);
      
      if (res.success) {
        // Redirection logic based on role is handled by App.jsx or here
        // We'll redirect to the target page or appropriate home
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Portal Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-800/10 mb-3">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-950 font-sans">
            AyurDiet Portal
          </h2>
          <p className="mt-2 text-sm text-emerald-800/70 font-medium">
            Practice Management & Nutrient Analysis
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl shadow-premium p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-emerald-950 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-semibold text-emerald-950">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-800 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-800 hover:bg-emerald-700 disabled:bg-emerald-800/60 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-800/10"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-b-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-6 border-t border-emerald-900/5">
            <p className="text-xs font-bold text-emerald-900/50 uppercase tracking-wider mb-3">
              Quick-Fill Demo Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleDemoLogin('admin@ayurdiet.com', 'admin123')}
                className="px-2 py-1.5 bg-slate-50 border border-slate-900/10 rounded-lg text-[10px] font-bold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => handleDemoLogin('dietitian1@ayurdiet.com', 'dietitian123')}
                className="px-2 py-1.5 bg-emerald-50 border border-emerald-900/10 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                Dietitian
              </button>
              <button
                onClick={() => handleDemoLogin('john@gmail.com', 'patient123')}
                className="px-2 py-1.5 bg-sky-50 border border-sky-900/10 rounded-lg text-[10px] font-bold text-sky-800 hover:bg-sky-100 transition-colors"
              >
                Patient
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-emerald-900/50 font-medium">
          Don't have a dietitian portal?{' '}
          <Link to="/register" className="font-semibold text-emerald-800 hover:underline">
            Register Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

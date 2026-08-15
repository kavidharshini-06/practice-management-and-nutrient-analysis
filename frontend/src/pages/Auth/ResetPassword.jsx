import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import { Heart, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If navigated from ForgotPassword, email will be in history state
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !newPassword || !confirmPassword) {
      return setError('Please fill in all fields.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await api.post('/auth/reset-password', { email, newPassword });
      if (res.data.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-stone-50 to-amber-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-800/10 mb-3">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-emerald-950">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-emerald-800/70 font-medium">
            Enter a secure new password for your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-emerald-900/5 rounded-2xl shadow-premium p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium border border-emerald-100">
                <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce" />
                <span>{success}</span>
              </div>
            )}

            {/* Email (read-only if passed) */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-emerald-950 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={!!location.state?.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-emerald-50/10 border border-emerald-900/10 rounded-xl text-emerald-950 disabled:bg-slate-50 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-emerald-950 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-emerald-950 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;

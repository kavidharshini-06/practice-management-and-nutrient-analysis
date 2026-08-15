import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, User, Mail, Lock, Phone, CheckCircle, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'dietitian', // Register defaults to dietitian (patients are typically added by dietitians, but can register too)
    phone: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role, phone } = formData;

    if (!name || !email || !password) {
      return setError('Please fill in all required fields.');
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      const res = await register(name, email, password, role, phone);
      if (res.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('An error occurred during registration.');
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
            Join AyurDiet
          </h2>
          <p className="mt-2 text-sm text-emerald-800/70 font-medium">
            Create your practitioner or client account
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

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-emerald-950 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="Dr. Shreya Roy"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-emerald-950 mb-1">
                Email Address <span className="text-red-500">*</span>
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
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-emerald-950 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 placeholder-emerald-900/40 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-emerald-950 mb-1">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-3 bg-emerald-50/20 border border-emerald-900/10 rounded-xl text-emerald-950 focus:ring-2 focus:ring-emerald-800 focus:border-transparent text-sm transition-all"
              >
                <option value="dietitian">Dietitian / Nutritionist</option>
                <option value="patient">Patient / Client</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-emerald-950 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-900/40">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
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
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-emerald-900/50 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-800 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

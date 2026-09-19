import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ScanButton from '../components/ScanButton';

export default function AuthScreen() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');
        await register(name.trim(), email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">NutriScan Account</span>
          <div className="w-10"></div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-green-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-950/40">
            N
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {isSignUp
              ? 'Save your custom allergen triggers and sync scan history across all your devices.'
              : 'Log in to access your saved dietary profile and scan history.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              !isSignUp
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              isSignUp
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[48px]"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[48px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[48px]"
            />
          </div>

          <div className="pt-2">
            <ScanButton
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              icon={isSignUp ? UserPlus : LogIn}
            >
              {isSubmitting ? 'Processing...' : isSignUp ? 'Create Account' : 'Log In'}
            </ScanButton>
          </div>
        </form>

        {/* Guest Use Disclaimer */}
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-2 min-h-[44px]"
          >
            Continue as Guest (No Login Required)
          </button>
        </div>
      </div>
    </div>
  );
}

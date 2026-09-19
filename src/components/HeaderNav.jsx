import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HeaderNav() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-green-950/30 group-hover:scale-105 transition-transform">
            N
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none block">
              NutriScan
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Ingredient & Health Decoder
            </span>
          </div>
        </NavLink>

        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${isActive
                ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <Camera className="w-4 h-4" />
            <span>Scan & Decode</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${isActive
                ? 'bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }
            `}
          >
            <Settings className="w-4 h-4" />
            <span>Preferences</span>
          </NavLink>
        </nav>

        {/* Right Actions: Flexible Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            aria-label="Toggle dark/light mode"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

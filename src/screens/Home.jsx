import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Type, ShieldAlert, Sparkles, Sun, Moon, ShieldCheck, Zap, Info } from 'lucide-react';
import ScanButton from '../components/ScanButton';
import { useTheme } from '../context/ThemeContext';
import { getAllergens, getCustomConcerns } from '../lib/storage';
import allergensData from '../data/allergens.json';

export default function Home() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [userAllergens, setUserAllergens] = useState([]);
  const [customConcerns, setCustomConcerns] = useState([]);

  useEffect(() => {
    setUserAllergens(getAllergens());
    setCustomConcerns(getCustomConcerns());
  }, []);

  const activeAllergenLabels = userAllergens
    .map((id) => {
      const found = allergensData.find((a) => a.id === id);
      return found ? `${found.icon} ${found.label}` : id;
    })
    .concat(customConcerns.map((c) => `⚡ "${c}"`));

  return (
    <div className="space-y-6 pb-24 md:pb-6 px-4 md:px-0">
      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Scanners & Controls) */}
        <div className="md:col-span-7 space-y-6">
          {/* Header text (Mobile only, Desktop uses HeaderNav) */}
          <div className="flex md:hidden items-center justify-between pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-950/50">
                N
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">NutriScan</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Plain-English Label Decoder</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </button>

              <Link
                to="/settings"
                className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 min-h-[44px] flex items-center"
              >
                Profile
              </Link>
            </div>
          </div>

          {/* Active Allergen Watch Strip */}
          {activeAllergenLabels.length > 0 ? (
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  <span className="font-bold text-slate-900 dark:text-slate-100">Watching for: </span>
                  <span>{activeAllergenLabels.join(', ')}</span>
                </div>
              </div>
              <Link to="/settings" className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex-shrink-0">
                Edit Filters
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between shadow-sm">
              <span>No allergen or concern filters set</span>
              <Link to="/settings" className="text-green-600 dark:text-green-400 font-bold hover:underline">
                Configure Profile
              </Link>
            </div>
          )}

          {/* Primary Action Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Decode Packaged Food Ingredients
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Photograph any package label or upload a photo to decode chemical codes, evaluate health concerns, and spot allergens instantly.
              </p>
            </div>

            {/* Hero Scan Button */}
            <div className="p-1 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/10">
              <ScanButton
                onClick={() => navigate('/camera-scan')}
                variant="primary"
                icon={Camera}
                className="py-4 text-lg font-extrabold shadow-green-950/40 min-h-[64px]"
              >
                Scan Ingredient Label Photo
              </ScanButton>
            </div>

            {/* Secondary Action Button */}
            <div className="pt-1">
              <ScanButton
                onClick={() => navigate('/review-text', { state: { rawText: '' } })}
                variant="secondary"
                icon={Type}
                className="min-h-[52px] text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Type Ingredients Manually
              </ScanButton>
            </div>
          </div>
        </div>

        {/* Right Column (Desktop Dashboard Sidebar: How NutriScan Works & Features) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" /> How NutriScan Works
            </h2>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-7 h-7 rounded-xl bg-green-600 text-white font-black flex items-center justify-center flex-shrink-0 text-xs">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block text-sm">Scan Label Photo</strong>
                  <span>Snap a photo of any packaged food ingredient label using your phone camera.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-7 h-7 rounded-xl bg-green-600 text-white font-black flex items-center justify-center flex-shrink-0 text-xs">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block text-sm">Authoritative Resource Analysis</strong>
                  <span>Every ingredient is evaluated against established FSSAI, EFSA, and food safety standards.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <div className="w-7 h-7 rounded-xl bg-green-600 text-white font-black flex items-center justify-center flex-shrink-0 text-xs">
                  3
                </div>
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block text-sm">Instant Safety & Allergen Alerts</strong>
                  <span>Get immediate alerts for your custom allergen triggers and an interactive AI Clinical Nutritionist assistant.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

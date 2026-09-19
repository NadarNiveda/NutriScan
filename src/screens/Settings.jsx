import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Info, CheckCircle2, Sun, Moon, Laptop, ShieldCheck } from 'lucide-react';
import allergensData from '../data/allergens.json';
import AllergenChip from '../components/AllergenChip';
import ScanButton from '../components/ScanButton';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  getAllergens,
  setAllergens,
  getCustomConcerns,
  setCustomConcerns
} from '../lib/storage';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, isGuest } = useAuth();

  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [customText, setCustomText] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSelectedAllergens(getAllergens());
    const concerns = getCustomConcerns();
    setCustomText(concerns.join(', '));
  }, []);

  const toggleAllergen = (id) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveSettings = () => {
    const finalConcerns = customText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    setAllergens(selectedAllergens);
    setCustomConcerns(finalConcerns);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between pb-24 md:pb-6 max-w-4xl mx-auto px-4 md:px-0 space-y-6">
      {/* Header */}
      <div className="space-y-1 pt-2">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-green-600 dark:text-green-400" /> Preferences & Customization
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure allergen triggers, flexible theme mode, and dietary concern filters
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200 text-sm p-4 rounded-2xl flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Your preferences have been saved successfully.</span>
        </div>
      )}

      {/* Flexible Theme Selection */}
      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-500" /> Appearance & Theme
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred visual mode:</p>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-2xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${
              theme === 'light'
                ? 'bg-green-50 border-green-500 text-green-700 dark:bg-slate-800 dark:text-white shadow-sm ring-1 ring-green-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-2xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${
              theme === 'dark'
                ? 'bg-slate-900 border-green-500 text-green-400 shadow-sm ring-1 ring-green-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400" />
            <span>Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-2xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${
              theme === 'system'
                ? 'bg-green-50 border-green-500 text-green-700 dark:bg-slate-800 dark:text-white shadow-sm ring-1 ring-green-500'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-500" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* Allergens Grid */}
      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" /> Preset Allergen Alert Triggers
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allergensData.map((allergen) => (
            <AllergenChip
              key={allergen.id}
              allergen={allergen}
              selected={selectedAllergens.includes(allergen.id)}
              onClick={() => toggleAllergen(allergen.id)}
            />
          ))}
        </div>
      </div>

      {/* Custom Concerns */}
      <div className="space-y-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-lg">
        <label className="block text-base font-bold">
          Custom Dietary & Health Concerns
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Comma-separated terms to highlight on labels (e.g. artificial colours, palm oil, high sodium)
        </p>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          rows={3}
          placeholder="e.g. artificial colours, palm oil, high fructose corn syrup"
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-sm placeholder-slate-400 focus:outline-none focus:border-green-500 min-h-[90px]"
        />
      </div>

      {/* Save Action */}
      <ScanButton onClick={handleSaveSettings} variant="primary">
        Save Preferences
      </ScanButton>

      {/* Credits & About */}
      <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-200 text-sm">
          <Info className="w-4 h-4 text-green-600 dark:text-green-400" /> Data Sources & Standard Guidelines
        </div>
        <p className="leading-relaxed">
          NutriScan analyzes ingredients using safety position statements and databases provided by:
        </p>
        <ul className="list-disc list-inside space-y-1 font-medium">
          <li><strong>FSSAI</strong> (Food Safety and Standards Authority of India)</li>
          <li><strong>EFSA</strong> (European Food Safety Authority)</li>
          <li><strong>Open Food Facts</strong> (Worldwide Barcode Registry)</li>
        </ul>
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-5 text-xs text-amber-900 dark:text-amber-300/90 leading-relaxed font-medium shadow-sm">
        <span className="font-extrabold uppercase text-amber-700 dark:text-amber-200 block mb-1">Medical Disclaimer</span>
        NutriScan is an informational tool, not medical or dietary advice. Always consult a healthcare professional about specific dietary concerns.
      </div>
    </div>
  );
}

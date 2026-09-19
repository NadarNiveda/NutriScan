import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import allergensData from '../data/allergens.json';
import AllergenChip from '../components/AllergenChip';
import ScanButton from '../components/ScanButton';
import { setAllergens, setCustomConcerns, setOnboarded } from '../lib/storage';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const navigate = useNavigate();
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [customText, setCustomText] = useState('');

  const toggleAllergen = (id) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = (skip = false) => {
    let finalAllergens = selectedAllergens;
    let finalConcerns = [];

    if (!skip && customText.trim()) {
      finalConcerns = customText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    }

    if (skip) {
      finalAllergens = [];
      finalConcerns = [];
    }

    setAllergens(finalAllergens);
    setCustomConcerns(finalConcerns);
    setOnboarded(true);

    if (onComplete) onComplete();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-5 md:p-10 pb-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-green-950/80 border border-green-600/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Welcome to NutriScan
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Personalize Your Scan</h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Photograph ingredients on packaged food to decode cryptic chemical names, spot allergens, and flag personal health concerns instantly.
          </p>
        </div>

        {/* Preset Allergens Selection */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">
            Select common allergens to flag:
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

        {/* Custom Concerns Field */}
        <div className="space-y-2 pt-2">
          <label className="block text-base font-bold text-slate-200">
            Anything else you're avoiding or watching for?
          </label>
          <p className="text-xs text-slate-400">
            Type custom keywords separated by commas (e.g. artificial colours, palm oil, high sodium)
          </p>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. artificial colours, palm oil, high fructose corn syrup"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 min-h-[90px]"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-6">
        <ScanButton onClick={() => handleSave(false)} variant="primary" icon={Sparkles}>
          Save Preferences & Start
        </ScanButton>

        <button
          type="button"
          onClick={() => handleSave(true)}
          className="w-full text-center py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 min-h-[48px]"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

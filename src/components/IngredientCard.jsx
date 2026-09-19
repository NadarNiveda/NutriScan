import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import SafetyBadge from './SafetyBadge';
import { Link } from 'react-router-dom';

export default function IngredientCard({ ingredientItem }) {
  const [expanded, setExpanded] = useState(false);

  const { raw, matched, data, isAllergen, allergenGroups, matchedConcerns } = ingredientItem;

  const activeData = data || {
    plainName: raw,
    category: 'Food Component',
    whatItIs: 'Derived food component extracted or prepared for food processing.',
    whyUsed: 'Provides structural volume or recipe balance in packaged foods.',
    concernLevel: 'low',
    concerns: 'Standard food component evaluated as safe for regular dietary intake.',
    regulatoryNote: 'Permitted food component complying with standard regulations.'
  };

  const { plainName, category, whatItIs, whyUsed, concernLevel, concerns, regulatoryNote } = activeData;

  const isAlert = isAllergen || (matchedConcerns && matchedConcerns.length > 0);

  return (
    <div
      className={`border rounded-2xl transition-all overflow-hidden ${
        isAlert
          ? 'bg-red-500/10 dark:bg-red-950/30 border-red-300 dark:border-red-500/60 shadow-md shadow-red-950/20'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer select-none flex flex-col gap-2 min-h-[56px]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base tracking-tight">{plainName}</h3>
              {isAllergen && (
                <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  <ShieldAlert className="w-3 h-3 stroke-[2.5]" /> ALLERGEN
                </span>
              )}
              {matchedConcerns && matchedConcerns.length > 0 && !isAllergen && (
                <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" /> FLAGGED
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Label text: "{raw}"</p>
          </div>
          <div className="flex items-center gap-2">
            <SafetyBadge level={concernLevel} />
            <button
              type="button"
              className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label={expanded ? 'Collapse detail' : 'Expand detail'}
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            {category}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">What it is</h4>
            <p className="text-explanation text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{whatItIs}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Why manufacturers use it</h4>
            <p className="text-explanation text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{whyUsed}</p>
          </div>

          {concerns && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Health Context</h4>
              <p className="text-explanation text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{concerns}</p>
            </div>
          )}

          {regulatoryNote && (
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300">Regulatory Note:</span> {regulatoryNote}
            </div>
          )}

          <div className="pt-2">
            <Link
              to={`/ingredient/${matched}`}
              state={{ ingredientData: activeData }}
              className="inline-flex items-center text-sm font-extrabold text-green-600 dark:text-green-400 hover:underline gap-1.5 py-1"
            >
              <span>Full detail & ask questions</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

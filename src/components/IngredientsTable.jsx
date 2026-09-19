import React from 'react';
import SafetyBadge from './SafetyBadge';
import { ShieldAlert, AlertTriangle, MoveHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IngredientsTable({ ingredients = [] }) {
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {/* Mobile Swipe Cue */}
      <div className="sm:hidden flex items-center justify-end gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pr-1">
        <MoveHorizontal className="w-3.5 h-3.5" />
        <span>Swipe table horizontally to view full matrix</span>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg scrollbar-thin">
        <table className="w-full text-left border-collapse text-sm min-w-[580px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold uppercase text-xs border-b border-slate-200 dark:border-slate-700">
              <th className="p-3.5 min-w-[140px]">Ingredient Name</th>
              <th className="p-3.5 min-w-[120px]">Category</th>
              <th className="p-3.5 min-w-[100px]">Concern Scale</th>
              <th className="p-3.5 min-w-[200px]">Plain Explanation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {ingredients.map((item, idx) => {
              const { raw, matched, data, isAllergen, matchedConcerns } = item;
              const isAlert = isAllergen || (matchedConcerns && matchedConcerns.length > 0);

              const activeData = data || {
                plainName: raw,
                category: 'Food Component',
                whatItIs: 'Derived food component extracted or prepared for food processing.',
                whyUsed: 'Provides structural volume or recipe balance in packaged foods.',
                concernLevel: 'low'
              };

              const { plainName, category, concernLevel, whatItIs, whyUsed } = activeData;

              return (
                <tr
                  key={`tbl_${idx}`}
                  className={`transition-colors ${
                    isAllergen
                      ? 'bg-red-500/10 dark:bg-red-950/40 border-l-4 border-l-red-500'
                      : isAlert || concernLevel === 'watch'
                      ? 'bg-amber-500/10 dark:bg-amber-950/30 border-l-4 border-l-amber-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Name */}
                  <td className="p-3.5">
                    <Link to={`/ingredient/${matched}`} state={{ ingredientData: activeData }} className="font-bold text-slate-900 dark:text-slate-100 hover:text-green-600 dark:hover:text-green-400 block">
                      {plainName}
                    </Link>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Label: "{raw}"</span>
                  </td>

                  {/* Category */}
                  <td className="p-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                      {category}
                    </span>
                  </td>

                  {/* Scale */}
                  <td className="p-3.5">
                    <SafetyBadge level={concernLevel} />
                  </td>

                  {/* Explanation */}
                  <td className="p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{whatItIs}</span>
                    <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{whyUsed}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


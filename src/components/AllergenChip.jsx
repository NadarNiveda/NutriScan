import React from 'react';
import { Check } from 'lucide-react';

export default function AllergenChip({ allergen, selected = false, onClick }) {
  const { label, icon } = allergen;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center justify-between min-h-[48px] px-3.5 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all active:scale-95 text-left w-full shadow-sm
        ${selected
          ? 'bg-rose-50 dark:bg-red-950/80 border-rose-500 dark:border-red-500 text-rose-900 dark:text-red-100 ring-2 ring-rose-500/80 dark:ring-red-500'
          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
        }
      `}
    >
      <span className="flex items-center gap-2 truncate">
        <span className="text-lg sm:text-xl leading-none flex-shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </span>
      {selected ? (
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-600 dark:bg-red-600 text-white flex items-center justify-center flex-shrink-0 ml-1.5 shadow-sm">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
      ) : (
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 ml-1.5"></span>
      )}
    </button>
  );
}


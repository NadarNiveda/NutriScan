export const STORAGE_KEYS = {
  ALLERGENS: 'nutriscan_allergens',
  CUSTOM_CONCERNS: 'nutriscan_custom_concerns',
  HISTORY: 'nutriscan_history',
  HAS_ONBOARDED: 'nutriscan_has_onboarded',
  HF_API_KEY: 'nutriscan_hf_api_key'
};

export const CONCERN_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  WATCH: 'watch'
};

export const CONCERN_COLORS = {
  low: {
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-600',
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white'
  },
  moderate: {
    bg: 'bg-amber-950/80',
    border: 'border-amber-500',
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-slate-950'
  },
  watch: {
    bg: 'bg-red-950/80',
    border: 'border-red-600',
    text: 'text-red-400',
    badgeBg: 'bg-red-600',
    badgeText: 'text-white'
  },
  unknown: {
    bg: 'bg-slate-100 dark:bg-slate-800/80',
    border: 'border-slate-300 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300'
  }
};


export const DEFAULT_LLM_TIMEOUT_MS = 6000;

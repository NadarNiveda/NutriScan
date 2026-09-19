import React from 'react';
import { CONCERN_COLORS } from '../utils/constants';

export default function SafetyBadge({ level = 'low', customText }) {
  const normLevel = level ? level.toLowerCase() : 'low';
  const config = CONCERN_COLORS[normLevel] || {
    badgeBg: 'bg-slate-700',
    badgeText: 'text-slate-200'
  };

  const labels = {
    low: 'Low Concern',
    moderate: 'Moderate Concern',
    watch: 'Watch Level',
    unknown: 'Not in our database yet'
  };


  const displayText = customText || labels[normLevel] || normLevel;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase shadow-sm ${config.badgeBg} ${config.badgeText}`}
    >
      {displayText}
    </span>
  );
}

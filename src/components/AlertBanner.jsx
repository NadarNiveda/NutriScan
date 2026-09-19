import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function AlertBanner({ allergenAlerts = [], concernAlerts = [] }) {
  if ((!allergenAlerts || allergenAlerts.length === 0) && (!concernAlerts || concernAlerts.length === 0)) {
    return null;
  }

  const hasAllergens = allergenAlerts && allergenAlerts.length > 0;

  return (
    <div
      className={`w-full rounded-2xl p-4.5 mb-5 shadow-lg border-2 ${
        hasAllergens
          ? 'bg-rose-50 dark:bg-red-950 border-rose-500 dark:border-red-500 text-rose-950 dark:text-red-100 ring-2 ring-rose-500/30 dark:ring-red-500/50'
          : 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-950 dark:text-amber-100 shadow-amber-500/10'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
          hasAllergens ? 'bg-rose-500/20 text-rose-600 dark:text-red-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
        }`}>
          {hasAllergens ? (
            <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight uppercase">
            {hasAllergens ? '⚠️ Allergen Warning Detected' : '⚡ Custom Health Concern Flagged'}
          </h3>

          {/* Allergen list */}
          {allergenAlerts.map((alert) => (
            <div key={alert.group} className="text-xs sm:text-sm bg-white/80 dark:bg-red-900/60 p-2.5 rounded-xl border border-rose-200 dark:border-red-700/60 shadow-sm">
              <span className="font-bold text-sm sm:text-base mr-1.5">{alert.icon} {alert.label}:</span>
              <span className="text-rose-900 dark:text-red-200 font-medium">
                Triggered by ingredient <strong>{alert.triggeredBy.join(', ')}</strong>
              </span>
            </div>
          ))}

          {/* Custom concern list */}
          {concernAlerts.map((alert) => (
            <div key={alert.concern} className="text-xs sm:text-sm bg-white/80 dark:bg-amber-900/60 p-2.5 rounded-xl border border-amber-200 dark:border-amber-700/60 shadow-sm">
              <span className="font-bold text-sm sm:text-base mr-1.5">Custom Concern ("{alert.concern}"):</span>
              <span className="text-amber-900 dark:text-amber-200 font-medium">
                Triggered by ingredient <strong>{alert.triggeredBy.join(', ')}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

}

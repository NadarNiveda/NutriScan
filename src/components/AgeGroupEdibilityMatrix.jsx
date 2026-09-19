import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Users, Info } from 'lucide-react';
import { evaluateAgeGroupEdibility } from '../lib/edibility';

export default function AgeGroupEdibilityMatrix({ analysis }) {
  if (!analysis || !analysis.ingredients || analysis.ingredients.length === 0) return null;

  const assessment = evaluateAgeGroupEdibility(analysis);
  const { overallVerdict, overallBadgeColor, overallSummaryText, groups } = assessment;

  const getStatusBadge = (status) => {
    if (status === 'unsafe' || status === 'not_recommended') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-red-500/10 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-500/40 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide leading-tight">
          <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" /> NOT RECOMMENDED
        </span>
      );
    }
    if (status === 'caution') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-500/40 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide leading-tight">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" /> CONSUME IN MODERATION
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide leading-tight">
        <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" /> SAFE TO CONSUME
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-xl">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-green-600/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Edibility Review by Age Group
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Clinical nutritionist breakdown across life stages & demographic sensitivity
            </p>
          </div>
        </div>
      </div>

      {/* Overall Edibility Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 shadow-sm ${
          overallBadgeColor === 'red'
            ? 'bg-red-500/10 border-red-500/40 text-red-900 dark:text-red-200'
            : overallBadgeColor === 'amber'
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {overallBadgeColor === 'red' ? (
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          ) : overallBadgeColor === 'amber' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white dark:bg-slate-950 border border-current shadow-sm inline-block">
            {overallVerdict}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-semibold leading-relaxed flex-1">
          {overallSummaryText}
        </p>
      </div>

      {/* 4 Age Group Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className={`p-4 sm:p-4.5 rounded-2xl border transition-all flex flex-col justify-between space-y-3.5 ${
              group.status === 'unsafe'
                ? 'bg-red-500/5 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300'
                : group.status === 'caution'
                ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
                : 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300'
            }`}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex-shrink-0">
                  {group.icon}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                    {group.title}
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                    {group.age}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-0.5">{getStatusBadge(group.status)}</div>

              {/* Reasons list */}
              <ul className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {group.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="font-medium text-[11px] text-slate-700 dark:text-slate-300">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

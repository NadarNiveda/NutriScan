import React from 'react';

export default function ProgressBar({ progress = 0, statusText = 'Processing image...' }) {
  const clampProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full space-y-2 py-2">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-300">
        <span>{statusText}</span>
        <span className="text-green-400">{clampProgress}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
        <div
          className="bg-green-600 h-full transition-all duration-300 ease-out rounded-full shadow-sm shadow-green-500/50"
          style={{ width: `${clampProgress}%` }}
        />
      </div>
    </div>
  );
}

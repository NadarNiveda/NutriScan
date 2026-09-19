import React from 'react';
import { Sparkles } from 'lucide-react';
import ScanButton from './ScanButton';

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No items found',
  description = 'Photograph any food package ingredient label to decode ingredients instantly.',
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl my-4 space-y-4 shadow-inner">
      <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm">
        <Icon className="w-7 h-7 stroke-[2]" />
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2 w-full max-w-xs">
          <ScanButton onClick={onAction} variant="primary">
            {actionLabel}
          </ScanButton>
        </div>
      )}
    </div>
  );
}

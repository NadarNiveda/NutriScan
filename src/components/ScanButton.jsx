import React from 'react';

export default function ScanButton({
  children,
  onClick,
  variant = 'primary',
  fullWidth = true,
  icon: Icon,
  disabled = false,
  type = 'button',
  className = ''
}) {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl min-h-[52px] min-w-[48px] px-5 py-3 text-base tracking-wide transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:pointer-events-none disabled:transform-none';
  
  const variants = {
    primary: 'bg-green-600 hover:bg-green-500 text-white font-extrabold shadow-green-600/20 border border-green-500/40',
    secondary: 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold border border-slate-300 dark:border-slate-700 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-500 text-white font-extrabold shadow-red-600/20 border border-red-500/40',
    outline: 'bg-transparent text-green-700 dark:text-green-400 border-2 border-green-600 hover:bg-green-500/10'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 mr-2.5 stroke-[2.2] flex-shrink-0" />}
      <span>{children}</span>
    </button>
  );
}

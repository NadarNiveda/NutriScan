import React from 'react';
import { NavLink } from 'react-router-dom';
import { Camera, Settings } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/', label: 'Scan & Decode', icon: Camera, end: true },
    { to: '/settings', label: 'Preferences', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl max-w-md mx-auto">
      <div className="flex items-center justify-around h-16 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-full h-full min-h-[48px] min-w-[48px] transition-all rounded-xl py-1 active:scale-95
                ${isActive
                  ? 'text-green-600 dark:text-green-400 font-extrabold bg-green-500/10 dark:bg-green-500/15'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon className="w-5 h-5 mb-0.5 stroke-[2.2]" />
              <span className="text-[11px] tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}


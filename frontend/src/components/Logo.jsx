import React from 'react';
import { ShieldAlert, Activity, Radio } from 'lucide-react';

export const Logo = ({ size = 'md', showText = true, variant = 'dark' }) => {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <div className="flex items-center gap-3 inline-flex">
      {/* Dynamic Emblem Badge */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-200"></div>
        <div className={`relative bg-slate-900 border border-slate-700/80 rounded-xl ${containerSizes[size]} text-white flex items-center justify-center shadow-lg`}>
          <ShieldAlert className={`${iconSizes[size]} text-red-500`} />
          <Activity className="w-3 h-3 text-orange-400 absolute bottom-1 right-1" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight text-slate-100 font-mono ${isLg ? 'text-2xl' : isSm ? 'text-base' : 'text-xl'}`}>
              Res<span className="text-red-500">Q</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-0.5">
            Emergency Command
          </p>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle, alert = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`cmd-card relative overflow-hidden transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${alert ? 'border-l-4 border-l-red-600' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${alert ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {trend === 'up' ? (
            <span className="text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              {trendValue}
            </span>
          ) : (
            <span className="text-red-600 flex items-center gap-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              {trendValue}
            </span>
          )}
          <span className="text-slate-400">vs last check</span>
        </div>
      )}
    </div>
  );
};

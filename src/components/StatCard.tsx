import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  trend?: { direction: 'up' | 'down'; value: string };
  accent?: 'aqua' | 'storm' | 'green' | 'orange' | 'red';
}

const accentMap = {
  aqua: { bg: 'from-aqua-500/20 to-aqua-500/5', text: 'text-aqua-400', border: 'border-aqua-500/20' },
  storm: { bg: 'from-storm-500/20 to-storm-500/5', text: 'text-storm-400', border: 'border-storm-500/20' },
  green: { bg: 'from-green-500/20 to-green-500/5', text: 'text-green-400', border: 'border-green-500/20' },
  orange: { bg: 'from-orange-500/20 to-orange-500/5', text: 'text-orange-400', border: 'border-orange-500/20' },
  red: { bg: 'from-red-500/20 to-red-500/5', text: 'text-red-400', border: 'border-red-500/20' },
};

export function StatCard({ label, value, sublabel, icon, trend, accent = 'aqua' }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className="stat-card animate-slide-up">
      <div className={`absolute inset-0 bg-gradient-to-br ${a.bg} opacity-50 pointer-events-none`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</span>
          {icon && (
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.bg} ${a.border} border flex items-center justify-center ${a.text}`}>
              {icon}
            </div>
          )}
        </div>
        <div className="font-display text-3xl font-bold text-white tabular-nums">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
          {trend && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

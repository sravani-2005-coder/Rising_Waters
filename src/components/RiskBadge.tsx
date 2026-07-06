import { classifyRisk } from '../lib/types';
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RiskBadgeProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RiskBadge({ probability, size = 'md', showLabel = true }: RiskBadgeProps) {
  const risk = classifyRisk(probability);
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  const iconSizes = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3.5 h-3.5' };

  const Icon =
    risk.level === 'severe' ? ShieldAlert
    : risk.level === 'high' ? AlertTriangle
    : risk.level === 'moderate' ? AlertCircle
    : CheckCircle2;

  return (
    <span className={`badge ${risk.bg} ${risk.border} ${risk.text} ${sizes[size]}`}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{risk.label}</span>}
    </span>
  );
}

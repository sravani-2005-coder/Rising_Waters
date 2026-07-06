import { useEffect, useState } from 'react';
import { classifyRisk } from '../lib/types';

interface RiskGaugeProps {
  probability: number;
  size?: number;
  animated?: boolean;
}

export function RiskGauge({ probability, size = 200, animated = true }: RiskGaugeProps) {
  const [displayProb, setDisplayProb] = useState(animated ? 0 : probability);
  const risk = classifyRisk(probability);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const stroke = 12;
  const center = size / 2;

  useEffect(() => {
    if (!animated) {
      setDisplayProb(probability);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1000;
    const from = 0;
    const to = probability;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayProb(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [probability, animated]);

  const offset = circumference * (1 - displayProb);
  const angle = displayProb * 360;
  const labelX = center + Math.cos((angle - 90) * (Math.PI / 180)) * (radius - 30);
  const labelY = center + Math.sin((angle - 90) * (Math.PI / 180)) * (radius - 30);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor={risk.color} />
          </linearGradient>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter="url(#gauge-glow)"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-bold text-white tabular-nums">
          {(displayProb * 100).toFixed(1)}%
        </span>
        <span className="text-xs uppercase tracking-widest text-slate-500 mt-1">Flood Risk</span>
        <span
          className="mt-2 text-sm font-semibold"
          style={{ color: risk.color }}
        >
          {risk.label}
        </span>
      </div>
      <div
        className="absolute w-3 h-3 rounded-full shadow-lg"
        style={{
          left: labelX - 6,
          top: labelY - 6,
          backgroundColor: risk.color,
          boxShadow: `0 0 12px ${risk.color}`,
        }}
      />
    </div>
  );
}

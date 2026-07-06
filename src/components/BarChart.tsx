interface BarChartProps {
  data: { label: string; value: number; color?: string; sublabel?: string }[];
  max?: number;
  height?: number;
  valueFormat?: (v: number) => string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  max,
  height = 200,
  valueFormat = (v) => v.toFixed(2),
  horizontal = false,
}: BarChartProps) {
  const maxVal = max ?? Math.max(...data.map((d) => d.value), 0.0001);

  if (horizontal) {
    return (
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={d.label} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-300 font-medium">{d.label}</span>
              <span className="text-sm text-slate-400 font-mono tabular-nums">
                {valueFormat(d.value)}
              </span>
            </div>
            <div className="h-2.5 bg-ink-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${(d.value / maxVal) * 100}%`,
                  background: d.color ?? 'linear-gradient(90deg, #22d3ee, #3b82f6)',
                  animationDelay: `${i * 60}ms`,
                }}
              />
            </div>
            {d.sublabel && (
              <p className="text-xs text-slate-500 mt-1">{d.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="text-xs text-slate-400 font-mono tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
            {valueFormat(d.value)}
          </div>
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-lg transition-all duration-700 ease-out hover:brightness-125"
              style={{
                height: `${(d.value / maxVal) * 100}%`,
                background: d.color ?? 'linear-gradient(180deg, #22d3ee, #0891b2)',
                minHeight: '4px',
                animationDelay: `${i * 60}ms`,
              }}
            />
          </div>
          <span className="text-xs text-slate-400 text-center truncate max-w-full">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

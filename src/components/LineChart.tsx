interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fill?: boolean;
  valueFormat?: (v: number) => string;
}

export function LineChart({
  data,
  height = 200,
  color = '#22d3ee',
  fill = true,
  valueFormat = (v) => v.toFixed(2),
}: LineChartProps) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  if (data.length === 0) {
    return <div className="text-slate-500 text-sm">No data</div>;
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 0.001);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * innerW;
    const y = padding.top + (1 - (d.value - minVal) / range) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padding.top + t * innerH);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((y, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={y}
          y2={y}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      {fill && <path d={areaD} fill="url(#line-fill)" />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r="4" fill={color} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          <circle cx={p.x} cy={p.y} r="14" fill="transparent" className="cursor-pointer" />
          <title>{`${p.label}: ${valueFormat(p.value)}`}</title>
        </g>
      ))}
      {points.map((p, i) => (
        <text
          key={`label-${i}`}
          x={p.x}
          y={height - 8}
          textAnchor="middle"
          className="fill-slate-500"
          style={{ fontSize: '10px' }}
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

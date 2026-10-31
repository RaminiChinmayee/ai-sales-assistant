import React, { useState } from 'react';

interface BarChartProps {
  data: Array<{ label: string; value: number; secondary?: number | string }>;
  title?: string;
  valuePrefix?: string;
  height?: number;
  color?: string;
}

export function BarChart({ data, title, valuePrefix = '$', height = 260, color = 'indigo' }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">No data to display in chart</div>;
  }

  const maxValue = Math.max(...data.map(d => Number(d.value) || 0), 1);

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">{title}</h4>
          <span className="text-xs text-slate-400">{data.length} categories</span>
        </div>
      )}
      <div className="flex items-end gap-3 pt-6 pb-2" style={{ height: `${height}px` }}>
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const percentage = Math.round((val / maxValue) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                  <div className="font-semibold text-sky-400">{item.label}</div>
                  <div>
                    {valuePrefix}{val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {item.secondary !== undefined ? ` (${item.secondary})` : ''}
                  </div>
                </div>
              )}

              {/* Value label on top */}
              <span className={`text-[11px] mb-1.5 font-medium transition-colors ${isHovered ? 'text-sky-300' : 'text-slate-400'}`}>
                {val >= 1000000 ? `${valuePrefix}${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${valuePrefix}${(val / 1000).toFixed(0)}k` : `${valuePrefix}${val}`}
              </span>

              {/* Bar */}
              <div className="w-full max-w-[56px] rounded-t-md bg-slate-800/80 relative overflow-hidden flex items-end transition-all duration-300" style={{ height: '100%' }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isHovered
                      ? 'bg-gradient-to-t from-sky-600 to-indigo-400 shadow-lg shadow-sky-500/20'
                      : 'bg-gradient-to-t from-indigo-700 to-sky-500 opacity-90'
                  }`}
                  style={{ height: `${Math.max(percentage, 4)}%` }}
                />
              </div>

              {/* X Axis Label */}
              <span
                className={`text-[11px] mt-2.5 truncate max-w-[80px] text-center transition-colors ${
                  isHovered ? 'text-sky-300 font-medium' : 'text-slate-400'
                }`}
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: Array<{ label: string; value: number; secondary?: number }>;
  title?: string;
  valuePrefix?: string;
  height?: number;
}

export function LineChart({ data, title, valuePrefix = '$', height = 260 }: LineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">No trend data to display</div>;
  }

  const values = data.map(d => Number(d.value) || 0);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const paddingX = 40;
  const paddingY = 30;
  const svgWidth = 600;
  const svgHeight = height;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((Number(d.value) - minVal) / range) * (svgHeight - paddingY * 2);
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    return `${acc} C ${cpX1} ${prev.y}, ${cpX2} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">{title}</h4>
          <span className="text-xs text-slate-400">Chronological Monthly Data</span>
        </div>
      )}
      <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
          <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#334155" opacity="0.6" />

          {/* Shaded Area under line */}
          <path d={areaD} fill="url(#lineGrad)" />

          {/* Main Line */}
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 7 : 4.5}
                  className={`transition-all duration-200 cursor-pointer ${
                    isHovered ? 'fill-sky-300 stroke-white stroke-2 shadow-lg' : 'fill-sky-500 stroke-slate-900 stroke-2'
                  }`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
                <text
                  x={p.x}
                  y={svgHeight - 10}
                  textAnchor="middle"
                  className="text-[11px] fill-slate-400 font-medium select-none"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover info badge */}
        {hoveredIdx !== null && (
          <div
            className="absolute z-20 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-sky-500/40 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
              top: `${points[hoveredIdx].y - 8}px`,
            }}
          >
            <div className="font-semibold text-sky-400">{points[hoveredIdx].label}</div>
            <div className="text-slate-100 font-mono">
              {valuePrefix}{Number(points[hoveredIdx].value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DonutChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
  valuePrefix?: string;
}

export function DonutChart({ data, title, valuePrefix = '$' }: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0) || 1;
  const colors = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899', '#a78bfa'];

  // Calculate arc angles
  let accumulatedAngle = 0;
  const slices = data.map((d, i) => {
    const val = Number(d.value) || 0;
    const ratio = val / total;
    const startAngle = accumulatedAngle;
    accumulatedAngle += ratio * 360;
    const endAngle = accumulatedAngle;
    const color = colors[i % colors.length];
    return { ...d, value: val, ratio, startAngle, endAngle, color };
  });

  const size = 180;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 26;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
      {title && (
        <h4 className="text-sm font-semibold text-slate-200 tracking-wide uppercase mb-4">{title}</h4>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
            {slices.map((slice, idx) => {
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = `${slice.ratio * circumference} ${circumference}`;
              const strokeDashoffset = -((slice.startAngle / 360) * circumference);
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Total</span>
            <span className="text-sm font-bold text-slate-100">
              {valuePrefix}{total >= 1000000 ? `${(total / 1000000).toFixed(2)}M` : `${(total / 1000).toFixed(1)}k`}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 min-w-[160px]">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                hoveredIdx === idx ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/50'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="font-medium truncate max-w-[100px]">{slice.label}</span>
              </div>
              <div className="text-right ml-3 font-mono">
                <span className="font-semibold">{Math.round(slice.ratio * 100)}%</span>
                <span className="text-[11px] text-slate-400 block">
                  {valuePrefix}{slice.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'sky',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: any;
  trend?: string;
  color?: string;
}) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-100 tracking-tight">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center justify-between mt-2 text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {trend && <span className="text-emerald-400 font-medium">{trend}</span>}
        </div>
      )}
    </div>
  );
}

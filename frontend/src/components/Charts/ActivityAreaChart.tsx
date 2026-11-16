import React, { useState } from 'react';
import { HISTORICAL_DECADE_DATA } from '../../data/spaceData';

export const ActivityAreaChart: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = HISTORICAL_DECADE_DATA;
  const maxVal = Math.max(...data.map(d => d.total));
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Build coordinate points
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.total / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  // Create smooth curved SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#39D5F2]" />
            GLOBAL MISSION CADENCE OVER DECADES
          </h4>
          <p className="text-[11px] text-[#8798B3]">Historical orbital launch counts & success progression</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-[#39D5F2]">
            <span className="w-2.5 h-1 bg-[#39D5F2] rounded" /> TOTAL LAUNCHES
          </span>
          <span className="flex items-center gap-1.5 text-[#10B981]">
            <span className="w-2.5 h-1 bg-[#10B981] rounded" /> SUCCESS RATE %
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-auto min-w-[500px] select-none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#39D5F2" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#648CFF" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#050914" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + chartHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#8798B3"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Glowing Stroke Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#39D5F2" 
            strokeWidth="2.5" 
            filter="url(#glow)" 
          />

          {/* Data Points & Interactive Scrubbing */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                {/* Vertical indicator line when hovered */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + chartHeight}
                    stroke="rgba(57, 213, 242, 0.5)"
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4}
                  fill={isHovered ? '#39D5F2' : '#0A1222'}
                  stroke="#39D5F2"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-200"
                />

                {/* Center dot */}
                <circle cx={pt.x} cy={pt.y} r={2} fill="#FFFFFF" />

                {/* X Axis Label */}
                <text
                  x={pt.x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fill={isHovered ? '#39D5F2' : '#8798B3'}
                  fontSize="10"
                  fontFamily="Space Grotesk, sans-serif"
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {pt.decade.replace(' (Current)', '')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Hover Tooltip Card */}
      {hoveredIdx !== null && (
        <div 
          className="absolute -top-3 right-0 bg-[#0A1222]/95 border border-[#39D5F2]/40 rounded-xl p-3 shadow-xl backdrop-blur-md font-mono text-xs z-20 space-y-1.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1">
            <span className="font-bold text-white">{data[hoveredIdx].decade}</span>
            <span className="text-[#39D5F2]">{data[hoveredIdx].total} Launches</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-[#8798B3] block">Successful</span>
              <span className="text-[#10B981] font-bold">{data[hoveredIdx].success}</span>
            </div>
            <div>
              <span className="text-[#8798B3] block">Failures</span>
              <span className="text-[#F43F5E] font-bold">{data[hoveredIdx].failure}</span>
            </div>
          </div>
          <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
            <span className="text-[#8798B3]">Success Rate:</span>
            <span className="text-[#39D5F2] font-bold">{data[hoveredIdx].successRate}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

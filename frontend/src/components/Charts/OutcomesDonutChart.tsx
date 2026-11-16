import React, { useState } from 'react';

export const OutcomesDonutChart: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const outcomes = [
    { label: 'Full Success', count: 4198, percent: 89.6, color: '#10B981', desc: 'Payload deployed accurately to nominal target orbit' },
    { label: 'Catastrophic Failure', count: 348, percent: 7.4, color: '#F43F5E', desc: 'Booster anomaly, explosion, or vehicle loss' },
    { label: 'Partial Mission Failure', count: 136, percent: 2.9, color: '#F59E0B', desc: 'Under-burn, anomalous orbital insertion, or sub-nominal apogee' },
  ];

  const total = outcomes.reduce((acc, curr) => acc + curr.count, 0);

  // SVG parameters
  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="flex flex-col items-center justify-between h-full">
      <div className="relative w-48 h-48 flex items-center justify-center my-2">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={strokeWidth}
          />

          {outcomes.map((item, index) => {
            const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercent / 100) * circumference);
            cumulativePercent += item.percent;

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Telemetry Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider">
            {hoveredIndex !== null ? outcomes[hoveredIndex].label : 'SUCCESS RATE'}
          </span>
          <span className="text-2xl font-display font-bold text-white tracking-tight">
            {hoveredIndex !== null ? `${outcomes[hoveredIndex].percent}%` : '89.6%'}
          </span>
          <span className="text-[10px] font-mono text-[#39D5F2]">
            {hoveredIndex !== null ? `${outcomes[hoveredIndex].count.toLocaleString()} MISSIONS` : '4,682 TOTAL'}
          </span>
        </div>
      </div>

      {/* Legend Rows */}
      <div className="w-full space-y-2 mt-2">
        {outcomes.map((item, index) => (
          <div
            key={item.label}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
              hoveredIndex === index ? 'bg-[#101B2D] border border-white/10' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div>
                <p className="text-xs font-semibold text-white">{item.label}</p>
                <p className="text-[10px] text-[#8798B3] font-mono">{item.desc}</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs font-bold text-white block">{item.count.toLocaleString()}</span>
              <span className="text-[10px] text-[#8798B3]">{item.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

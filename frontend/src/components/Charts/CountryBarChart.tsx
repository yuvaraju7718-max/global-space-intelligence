import React from 'react';
import { COUNTRY_STATS } from '../../data/spaceData';

interface CountryBarChartProps {
  onSelectCountry?: (country: string) => void;
  selectedCountry?: string;
}

export const CountryBarChart: React.FC<CountryBarChartProps> = ({ 
  onSelectCountry, 
  selectedCountry 
}) => {
  const maxMissions = Math.max(...COUNTRY_STATS.map(c => c.totalMissions));

  return (
    <div className="space-y-3">
      {COUNTRY_STATS.map((country) => {
        const isSelected = selectedCountry === country.country;
        const totalPct = (country.totalMissions / maxMissions) * 100;
        const successPct = (country.successful / country.totalMissions) * 100;

        return (
          <div
            key={country.code}
            onClick={() => onSelectCountry && onSelectCountry(country.country)}
            className={`group p-2.5 rounded-xl border transition cursor-pointer ${
              isSelected 
                ? 'bg-[#101B2D] border-[#39D5F2]/40 shadow-glow-cyan' 
                : 'bg-[#101B2D]/40 border-white/5 hover:border-white/15 hover:bg-[#101B2D]/80'
            }`}
          >
            {/* Top row: Country label & stats */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[#39D5F2] font-semibold">
                  {country.code}
                </span>
                <span className={`font-semibold tracking-wide ${isSelected ? 'text-[#39D5F2]' : 'text-white group-hover:text-[#39D5F2]'} transition`}>
                  {country.country}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-[#8798B3]">
                  {country.totalMissions} launches
                </span>
                <span className="text-[#10B981] font-semibold">
                  {country.successRate}% SR
                </span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden flex border border-white/5">
              {/* Successful segment */}
              <div
                style={{ width: `${(totalPct * (country.successful / country.totalMissions))}%` }}
                className="h-full bg-gradient-to-r from-[#39D5F2] to-[#648CFF] rounded-l-full transition-all duration-500"
                title={`${country.successful} Successful Missions`}
              />
              {/* Failed segment */}
              <div
                style={{ width: `${(totalPct * (country.failed / country.totalMissions))}%` }}
                className="h-full bg-[#F43F5E] rounded-r-full transition-all duration-500"
                title={`${country.failed} Launch/Orbital Failures`}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8798B3] mt-1 font-mono">
              <span>{country.shareOfGlobal}% global launch share</span>
              <span>1st launch: {country.firstLaunchYear}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

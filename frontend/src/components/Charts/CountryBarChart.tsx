import React from 'react';
import { COUNTRY_STATS } from '../../data/spaceData';
import { CountryAggStat } from '../../types';

interface CountryBarChartProps {
  countries?: CountryAggStat[];
  onSelectCountry?: (country: string) => void;
  selectedCountry?: string;
}

export const CountryBarChart: React.FC<CountryBarChartProps> = ({ 
  countries: propCountries,
  onSelectCountry, 
  selectedCountry 
}) => {
  // If real countries are provided, map them into the display structure
  const displayCountries = propCountries && propCountries.length > 0
    ? propCountries.slice(0, 8).map(c => ({
        code: c.code || (c.country.length <= 4 ? c.country.toUpperCase() : c.country.slice(0, 3).toUpperCase()),
        country: c.country,
        totalMissions: c.total,
        successful: c.successful,
        failed: c.failed,
        successRate: c.successRate,
        shareOfGlobal: c.shareOfGlobal,
        firstLaunchYear: c.firstLaunchYear
      }))
    : COUNTRY_STATS;

  const maxMissions = Math.max(...displayCountries.map(c => c.totalMissions), 1);

  return (
    <div className="space-y-3">
      {displayCountries.map((country) => {
        const isSelected = selectedCountry === country.country;
        const totalPct = (country.totalMissions / maxMissions) * 100;
        const successShare = country.totalMissions > 0 
          ? country.successful / country.totalMissions 
          : 0;
        const failedShare = country.totalMissions > 0 
          ? country.failed / country.totalMissions 
          : 0;

        return (
          <div
            key={country.country}
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
                  {country.totalMissions.toLocaleString()} launches
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
                style={{ width: `${(totalPct * successShare)}%` }}
                className="h-full bg-gradient-to-r from-[#39D5F2] to-[#648CFF] rounded-l-full transition-all duration-500"
                title={`${country.successful.toLocaleString()} Successful Missions`}
              />
              {/* Failed segment */}
              <div
                style={{ width: `${(totalPct * failedShare)}%` }}
                className="h-full bg-[#F43F5E] rounded-r-full transition-all duration-500"
                title={`${country.failed.toLocaleString()} Launch / Mission Failures`}
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

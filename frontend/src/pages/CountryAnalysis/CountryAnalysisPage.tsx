import React, { useState } from 'react';
import { 
  BarChart3, 
  Globe2, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Crosshair,
  ArrowRight,
  ShieldAlert,
  Award
} from 'lucide-react';
import { COUNTRY_STATS, SPACE_AGENCIES } from '../../data/spaceData';
import { CountryStat, FilterState } from '../../types';

interface CountryAnalysisPageProps {
  filters: FilterState;
}

export const CountryAnalysisPage: React.FC<CountryAnalysisPageProps> = ({ filters }) => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['United States', 'Russia / Soviet Union']);

  const toggleCountrySelection = (countryName: string) => {
    if (selectedCountries.includes(countryName)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter(c => c !== countryName));
      }
    } else {
      setSelectedCountries([...selectedCountries, countryName]);
    }
  };

  const comparedCountryData = COUNTRY_STATS.filter(c => selectedCountries.includes(c.country));

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              SOVEREIGN SPACE COMPETITIVENESS
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            COUNTRY PROFILES & HEAD-TO-HEAD COMPARATIVE BENCHMARK
          </h2>
          <p className="text-xs text-[#8798B3]">
            Multi-country comparison of orbital launch cadence, failure rates, and sovereign space agency capacity.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0A1222] p-2 rounded-xl border border-white/10 font-mono text-xs">
          <Globe2 className="w-4 h-4 text-[#39D5F2]" />
          <span className="text-[#39D5F2] font-semibold">{selectedCountries.length} NATIONS</span>
          <span className="text-[#8798B3]">IN COMPARISON</span>
        </div>
      </div>

      {/* Nation Multi-Selector Pills */}
      <div className="space-panel p-4 rounded-2xl space-y-2">
        <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block">
          SELECT 2 OR MORE SOVEREIGN STATES TO COMPARE:
        </span>
        <div className="flex flex-wrap gap-2">
          {COUNTRY_STATS.map(c => {
            const isSelected = selectedCountries.includes(c.country);
            return (
              <button
                key={c.code}
                onClick={() => toggleCountrySelection(c.country)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#39D5F2]/20 border-[#39D5F2] text-white shadow-sm font-semibold'
                    : 'bg-[#0A1222]/80 border-white/5 text-[#8798B3] hover:text-white hover:bg-[#101B2D]'
                }`}
              >
                <span>{c.country}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-[#39D5F2] text-black font-bold' : 'bg-white/10'}`}>
                  {c.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Head-to-Head Comparison Matrix */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#39D5F2]" />
            COMPARATIVE TELEMETRY BENCHMARK
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">ACTIVE SELECTION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparedCountryData.map((country) => (
            <div key={country.code} className="p-4 rounded-xl bg-[#0A1222]/90 border border-[#39D5F2]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{country.country}</span>
                  <span className="text-[10px] font-mono text-[#8798B3]">CODE: {country.code}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#39D5F2]/10 text-[#39D5F2]">
                  {country.shareOfGlobal}% Global
                </span>
              </div>

              {/* Success Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8798B3]">SUCCESS RATE:</span>
                  <span className="text-[#10B981] font-bold">{country.successRate}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${country.successRate}%` }} />
                </div>
              </div>

              {/* Data points */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-[#101B2D]">
                  <span className="text-[10px] text-[#8798B3] block">TOTAL LAUNCHES</span>
                  <span className="text-sm font-bold text-white">{country.totalMissions}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#101B2D]">
                  <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                  <span className="text-sm font-bold text-[#10B981]">{country.successful}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#101B2D]">
                  <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                  <span className="text-sm font-bold text-[#F43F5E]">{country.failed}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#101B2D]">
                  <span className="text-[10px] text-[#8798B3] block">INAUGURAL YEAR</span>
                  <span className="text-sm font-bold text-[#648CFF]">{country.firstLaunchYear}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agency Leaderboard Breakdown */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#A78BFA]" />
            SPACE AGENCY & COMMERCIAL OPERATOR LEADERBOARD
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">TOP 10 OPERATORS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Agency</th>
                <th className="pb-2">Country / Region</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Missions</th>
                <th className="pb-2">Success Rate</th>
                <th className="pb-2">Primary Vehicles</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {SPACE_AGENCIES.map(agency => (
                <tr key={agency.id} className="hover:bg-[#14233D] transition">
                  <td className="py-3 font-sans font-semibold text-white flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[11px] font-mono text-[#39D5F2] font-bold">
                      {agency.acronym}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{agency.name}</div>
                      <div className="text-[10px] text-[#8798B3] font-mono">Founded {agency.founded}</div>
                    </div>
                  </td>
                  <td className="py-3 text-[#8798B3]">{agency.country}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/70">
                      {agency.type}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-white">{agency.totalMissions}</td>
                  <td className="py-3">
                    <span className="text-[#10B981] font-bold">{agency.successRate}%</span>
                  </td>
                  <td className="py-3 text-[11px] text-[#8798B3]">
                    {agency.primaryVehicles.slice(0, 3).join(', ')}
                  </td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      agency.status === 'Active'
                        ? 'bg-[#10B981]/15 text-[#10B981]'
                        : 'bg-white/10 text-[#8798B3]'
                    }`}>
                      {agency.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

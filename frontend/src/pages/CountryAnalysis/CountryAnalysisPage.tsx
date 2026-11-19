import React, { useState, useEffect, useMemo } from 'react';
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
  Award,
  Search,
  AlertTriangle,
  Rocket,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { FilterState, CleanedMissionRecord, CountryAggStat, AgencyRankingStat } from '../../types';
import { 
  loadCleanedSpaceMissions, 
  calculateCountryStats, 
  calculateAgencyRankings,
  getCountryDeepProfile 
} from '../../services/dataService';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';

interface CountryAnalysisPageProps {
  filters: FilterState;
}

export const CountryAnalysisPage: React.FC<CountryAnalysisPageProps> = () => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active primary country for deep inspection
  const [activeCountry, setActiveCountry] = useState<string>('USA');

  // Multi-country selection for head-to-head comparison
  const [comparedCountries, setComparedCountries] = useState<string[]>(['USA', 'USSR', 'Russia', 'China']);

  // Country search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected mission for inspection modal
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);

  // Load real dataset
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await loadCleanedSpaceMissions();
        if (isMounted) {
          setMissions(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load space missions dataset');
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute country statistics (sorted descending by total launches using launch_country)
  const countryStats = useMemo(() => calculateCountryStats(missions), [missions]);

  // Compute top operator / agency rankings from real data
  const agencyRankings = useMemo(() => calculateAgencyRankings(missions, 15), [missions]);

  // Deep operational profile for active selected country
  const countryProfile = useMemo(() => {
    return getCountryDeepProfile(missions, activeCountry);
  }, [missions, activeCountry]);

  // Filtered countries for selector / leaderboard
  const filteredCountryStats = useMemo(() => {
    if (!searchQuery.trim()) return countryStats;
    const q = searchQuery.toLowerCase().trim();
    return countryStats.filter(c => 
      c.country.toLowerCase().includes(q) || 
      (c.code && c.code.toLowerCase().includes(q))
    );
  }, [countryStats, searchQuery]);

  // Compared countries data
  const comparedData = useMemo(() => {
    return comparedCountries
      .map(name => countryStats.find(c => c.country === name))
      .filter((c): c is CountryAggStat => c !== undefined);
  }, [countryStats, comparedCountries]);

  // Max launches among compared countries for visual normalization
  const maxComparedLaunches = useMemo(() => {
    if (comparedData.length === 0) return 100;
    return Math.max(...comparedData.map(c => c.total));
  }, [comparedData]);

  // Toggle country in comparison list (minimum 2)
  const toggleComparisonCountry = (countryName: string) => {
    if (comparedCountries.includes(countryName)) {
      if (comparedCountries.length > 2) {
        setComparedCountries(comparedCountries.filter(c => c !== countryName));
      }
    } else {
      if (comparedCountries.length < 5) {
        setComparedCountries([...comparedCountries, countryName]);
      }
    }
  };

  // Select country for both active deep dive and inclusion in comparison
  const handleSelectCountry = (countryName: string) => {
    setActiveCountry(countryName);
    if (!comparedCountries.includes(countryName)) {
      if (comparedCountries.length >= 4) {
        setComparedCountries([...comparedCountries.slice(1), countryName]);
      } else {
        setComparedCountries([...comparedCountries, countryName]);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              SOVEREIGN SPACE COMPETITIVENESS // LAUNCH COUNTRY ATTRIBUTION
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            COUNTRY PROFILES & HEAD-TO-HEAD COMPARATIVE BENCHMARK
          </h2>
          <p className="text-xs text-[#8798B3]">
            Verified analysis of national launch programs, orbital success rates, vehicle fleets, and operating agencies using launch_country attribution.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0A1222] p-2.5 rounded-xl border border-white/10 font-mono text-xs">
          <Globe2 className="w-4 h-4 text-[#39D5F2]" />
          <div>
            <div className="text-white font-semibold">
              <span className="text-[#39D5F2]">{countryStats.length} SOVEREIGN ENTITIES</span>
            </div>
            <div className="text-[10px] text-[#8798B3]">{comparedCountries.length} IN ACTIVE COMPARISON</div>
          </div>
        </div>
      </div>

      {/* Sovereign Nation Selector & Search Pills */}
      <div className="space-panel p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block">
            SELECT PRIMARY STATE (CLICK TO INSPECT PROFILE) • TOGGLE PILL TO COMPARE:
          </span>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8798B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter country by name or code..."
              className="w-full pl-8 pr-3 py-1 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white placeholder-[#8798B3] font-mono focus:outline-none focus:border-[#39D5F2]"
            />
          </div>
        </div>

        {/* Interactive Country Pills */}
        <div className="flex flex-wrap gap-2">
          {filteredCountryStats.map(c => {
            const isPrimary = activeCountry === c.country;
            const isCompared = comparedCountries.includes(c.country);

            return (
              <div 
                key={c.country}
                className="inline-flex rounded-xl overflow-hidden border border-white/10 text-xs font-mono"
              >
                {/* Primary select button */}
                <button
                  onClick={() => handleSelectCountry(c.country)}
                  className={`px-3 py-1.5 transition flex items-center gap-2 ${
                    isPrimary
                      ? 'bg-[#39D5F2]/25 text-white font-bold border-r border-[#39D5F2]/40'
                      : 'bg-[#0A1222]/80 text-[#8798B3] hover:text-white hover:bg-[#101B2D] border-r border-white/5'
                  }`}
                  title={`View deep profile for ${c.country}`}
                >
                  <span>{c.country}</span>
                  <span className={`text-[10px] px-1 rounded ${isPrimary ? 'bg-[#39D5F2] text-black font-bold' : 'bg-white/10 text-[#8798B3]'}`}>
                    {c.total}
                  </span>
                </button>

                {/* Compare toggle button */}
                <button
                  onClick={() => toggleComparisonCountry(c.country)}
                  className={`px-2 py-1.5 transition text-[10px] font-bold ${
                    isCompared
                      ? 'bg-[#A78BFA]/20 text-[#A78BFA] hover:bg-[#A78BFA]/30'
                      : 'bg-[#0A1222]/60 text-[#8798B3]/50 hover:text-white hover:bg-[#101B2D]'
                  }`}
                  title={isCompared ? `Remove ${c.country} from comparison matrix` : `Add ${c.country} to comparison matrix`}
                >
                  {isCompared ? 'COMPARING' : '+COMPARE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Selected Country Deep Profile */}
      {countryProfile && (
        <div className="space-panel p-5 rounded-2xl space-y-5 border border-[#39D5F2]/30 shadow-2xl">
          {/* Header row with country summary */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#101B2D] to-[#0A1222] border border-[#39D5F2]/40 flex items-center justify-center font-mono font-bold text-lg text-[#39D5F2] shadow-glow-cyan">
                {countryProfile.code || countryProfile.country.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-display font-bold text-white tracking-wide">
                    {countryProfile.country}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#39D5F2]/10 text-[#39D5F2] border border-[#39D5F2]/30">
                    {countryProfile.shareOfGlobal}% GLOBAL SHARE
                  </span>
                </div>
                <p className="text-xs text-[#8798B3] font-mono">
                  Operational Range: {countryProfile.firstYear}–{countryProfile.latestYear || 2026} ({((countryProfile.latestYear || 2026) - (countryProfile.firstYear || 1957) + 1)} years)
                </p>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">TOTAL FLIGHTS</span>
                <span className="text-base font-bold text-white">{countryProfile.total.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                <span className="text-base font-bold text-[#10B981]">{countryProfile.successful.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                <span className="text-base font-bold text-[#F43F5E]">{countryProfile.failed.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">SUCCESS RATE</span>
                <span className="text-base font-bold text-[#39D5F2]">{countryProfile.successRate}%</span>
              </div>
            </div>
          </div>

          {/* Small Sample Size Warning Banner (Statistical Significance Rule) */}
          {countryProfile.isSmallSample && (
            <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/40 flex items-start gap-3 text-xs font-mono">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-[#F59E0B] uppercase block tracking-wider">
                  STATISTICAL SIGNIFICANCE NOTICE // SMALL SAMPLE SIZE ({countryProfile.total} TOTAL FLIGHT{countryProfile.total === 1 ? '' : 'S'})
                </span>
                <p className="text-[#EAF3FF] leading-relaxed">
                  With only {countryProfile.total} recorded orbital launch attempt{countryProfile.total === 1 ? '' : 's'}, {countryProfile.country}&apos;s calculated success rate of {countryProfile.successRate}% has high statistical variance. It should not be interpreted as an established long-term operational baseline nor directly compared against high-volume spacefaring powers without acknowledging sample constraints.
                </p>
              </div>
            </div>
          )}

          {/* Historical Cadence Over Time (Year-by-Year Bar Chart) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-[#39D5F2]" />
                {countryProfile.country} HISTORICAL LAUNCH CADENCE OVER TIME
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">
                {countryProfile.yearlyCadence.length} ACTIVE YEARS
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0A1222] border border-white/5 overflow-x-auto">
              <div className="flex items-end gap-1 min-w-[580px] h-32 px-1">
                {(() => {
                  const maxCountryYear = Math.max(...countryProfile.yearlyCadence.map(y => y.total), 1);
                  return countryProfile.yearlyCadence.map(y => {
                    const heightPercent = (y.total / maxCountryYear) * 100;
                    const successPercent = (y.success / y.total) * 100;

                    return (
                      <div 
                        key={y.year} 
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                        title={`${y.year}: ${y.total} launches (${y.success} success, ${y.failure} failure) — ${y.successRate}% SR`}
                      >
                        <div 
                          className="w-full rounded-t overflow-hidden flex flex-col justify-end group-hover:brightness-125 transition"
                          style={{ height: `${Math.max(heightPercent, 6)}%` }}
                        >
                          <div className="w-full bg-[#F43F5E]" style={{ height: `${100 - successPercent}%` }} />
                          <div className="w-full bg-[#10B981]" style={{ height: `${successPercent}%` }} />
                        </div>
                        <span className="text-[8px] font-mono mt-1 text-[#8798B3] group-hover:text-white transform -rotate-45 origin-left">
                          {y.year % 5 === 0 || y.year === countryProfile.firstYear || y.year === countryProfile.latestYear ? y.year : ''}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Dual Columns: Top Launch Vehicles & Operating Agencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Vehicles */}
            <div className="p-4 rounded-xl bg-[#0A1222] border border-white/5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-[#39D5F2]" />
                  PRIMARY LAUNCH VEHICLES
                </span>
                <span className="text-[10px] font-mono text-[#8798B3]">TOP 5 FLEET</span>
              </div>

              <div className="space-y-2">
                {countryProfile.topVehicles.map(v => (
                  <div key={v.vehicle} className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-[#101B2D]/60 border border-white/5">
                    <span className="text-white font-semibold truncate max-w-[180px]">{v.vehicle}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8798B3]">{v.count} flights</span>
                      <span className="text-[#10B981] font-bold">{v.successRate}% SR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operating Agencies */}
            <div className="p-4 rounded-xl bg-[#0A1222] border border-white/5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#A78BFA]" />
                  MAJOR OPERATING AGENCIES
                </span>
                <span className="text-[10px] font-mono text-[#8798B3]">KEY OPERATORS</span>
              </div>

              <div className="space-y-2">
                {countryProfile.topAgencies.map(a => (
                  <div key={a.agency} className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-[#101B2D]/60 border border-white/5">
                    <span className="text-white font-semibold truncate max-w-[180px]">{a.agency}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8798B3]">{a.count} flights</span>
                      <span className="text-[#10B981] font-bold">{a.successRate}% SR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Mission Manifest for Selected Country */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#39D5F2]" />
                RECENT FLIGHT OPERATIONS // {countryProfile.country}
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">LATEST {countryProfile.recentMissions.length} MISSIONS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                    <th className="pb-2">Date / Tag</th>
                    <th className="pb-2">Mission Payload</th>
                    <th className="pb-2">Launch Vehicle</th>
                    <th className="pb-2">Agency</th>
                    <th className="pb-2">Spaceport</th>
                    <th className="pb-2 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {countryProfile.recentMissions.map(m => (
                    <tr 
                      key={m.launch_tag} 
                      onClick={() => setSelectedMission(m)}
                      className="hover:bg-[#14233D] transition cursor-pointer group"
                    >
                      <td className="py-2.5 font-semibold text-white">
                        <div>{m.date || m.year}</div>
                        <div className="text-[10px] text-[#8798B3] group-hover:text-[#39D5F2]">{m.launch_tag}</div>
                      </td>
                      <td className="py-2.5 text-white font-semibold">
                        {m.mission || m.flight || m.launch_vehicle}
                      </td>
                      <td className="py-2.5 text-[#39D5F2]">{m.launch_vehicle}</td>
                      <td className="py-2.5 text-[#8798B3]">{m.agency || 'N/A'}</td>
                      <td className="py-2.5 text-[#8798B3]">{m.launch_site}</td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.outcome === 'Success'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                        }`}>
                          {m.outcome === 'Success' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{m.outcome}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Head-to-Head Comparative Benchmark Matrix */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[#39D5F2]" />
            HEAD-TO-HEAD COMPARATIVE BENCHMARK ({comparedData.length} NATIONS SELECTED)
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">REAL DATASET METRICS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparedData.map((country) => (
            <div 
              key={country.country} 
              onClick={() => setActiveCountry(country.country)}
              className={`p-4 rounded-xl border space-y-3 cursor-pointer transition ${
                activeCountry === country.country 
                  ? 'bg-[#101B2D] border-[#39D5F2]/50 shadow-glow-cyan' 
                  : 'bg-[#0A1222]/90 border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{country.country}</span>
                  <span className="text-[10px] font-mono text-[#8798B3]">CODE: {country.code}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#39D5F2]/10 text-[#39D5F2]">
                  {country.shareOfGlobal}% Global
                </span>
              </div>

              {/* Success Rate Gauge */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#8798B3]">SUCCESS RATE:</span>
                  <span className="text-[#10B981] font-bold">{country.successRate}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-[#10B981] h-full" style={{ width: `${country.successRate}%` }} />
                  <div className="bg-[#F43F5E] h-full" style={{ width: `${100 - country.successRate}%` }} />
                </div>
              </div>

              {/* Data points */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded-lg bg-[#0A1222]">
                  <span className="text-[10px] text-[#8798B3] block">TOTAL FLIGHTS</span>
                  <span className="text-sm font-bold text-white">{country.total.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0A1222]">
                  <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                  <span className="text-sm font-bold text-[#10B981]">{country.successful.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0A1222]">
                  <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                  <span className="text-sm font-bold text-[#F43F5E]">{country.failed.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0A1222]">
                  <span className="text-[10px] text-[#8798B3] block">INAUGURAL YEAR</span>
                  <span className="text-sm font-bold text-[#648CFF]">{country.firstLaunchYear}</span>
                </div>
              </div>

              {/* Relative Cadence Bar */}
              <div className="pt-1">
                <span className="text-[9px] font-mono text-[#8798B3] block mb-1">RELATIVE VOLUME</span>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#39D5F2] h-full rounded-full" 
                    style={{ width: `${(country.total / maxComparedLaunches) * 100}%` }} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Space Agency & Commercial Operator Leaderboard */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#A78BFA]" />
              GLOBAL SPACE OPERATORS & AGENCIES LEADERBOARD (CLEANED DATASET)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Ranked by verified orbital missions and program success rate.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8798B3]">TOP 15 OPERATORS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Rank / Operator</th>
                <th className="pb-2">Sovereign State</th>
                <th className="pb-2">Total Missions</th>
                <th className="pb-2">Successful</th>
                <th className="pb-2">Failures</th>
                <th className="pb-2">Success Rate</th>
                <th className="pb-2 text-right">Cadence Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agencyRankings.map((agency, idx) => (
                <tr key={agency.agency} className="hover:bg-[#14233D] transition">
                  <td className="py-3 font-sans font-semibold text-white flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-mono text-[#39D5F2] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{agency.agency}</div>
                    </div>
                  </td>
                  <td className="py-3 text-[#8798B3]">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white">
                      {agency.primaryCountry || 'Global'}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-white">{agency.total.toLocaleString()}</td>
                  <td className="py-3 text-[#10B981] font-semibold">{agency.successful.toLocaleString()}</td>
                  <td className="py-3 text-[#F43F5E] font-semibold">{agency.failed.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="text-[#10B981] font-bold">{agency.successRate}%</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-block w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#39D5F2] h-full rounded-full" 
                        style={{ width: `${(agency.total / agencyRankings[0].total) * 100}%` }} 
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for detailed mission inspection */}
      {selectedMission && (
        <MissionDetailModal 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  Rocket, 
  User, 
  Moon, 
  Compass, 
  Eye, 
  Cpu, 
  Zap, 
  Radio, 
  Award,
  ChevronRight,
  TrendingUp,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  ChevronLeft
} from 'lucide-react';
import { TIMELINE_MILESTONES } from '../../data/spaceData';
import { 
  FilterState, 
  TimelineMilestone, 
  CleanedMissionRecord, 
  YearCadenceStat, 
  DecadeCadenceStat 
} from '../../types';
import { 
  loadCleanedSpaceMissions, 
  calculateYearCadence, 
  calculateDecadeCadence, 
  getPeakLaunchYears,
  filterMissions
} from '../../services/dataService';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';

interface MissionTimelinePageProps {
  filters: FilterState;
}

export const MissionTimelinePage: React.FC<MissionTimelinePageProps> = () => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedMilestone, setSelectedMilestone] = useState<TimelineMilestone>(TIMELINE_MILESTONES[0]);
  const [activeEra, setActiveEra] = useState<string>('All Eras');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [hoveredYearData, setHoveredYearData] = useState<YearCadenceStat | null>(null);

  // Mission table filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('All');
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);
  const [missionPage, setMissionPage] = useState<number>(1);
  const missionsPerPage = 12;

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

  // Calculate year & decade cadence from real dataset
  const yearCadence = useMemo(() => calculateYearCadence(missions), [missions]);
  const decadeCadence = useMemo(() => calculateDecadeCadence(missions), [missions]);
  const peakYears = useMemo(() => getPeakLaunchYears(yearCadence, 4), [yearCadence]);

  // Max launches in any single year for chart normalization
  const maxYearLaunches = useMemo(() => {
    if (yearCadence.length === 0) return 100;
    return Math.max(...yearCadence.map(y => y.total));
  }, [yearCadence]);

  // Eras definition
  const eras = [
    { label: 'All Eras', range: [1957, 2026] },
    { label: 'Space Race Dawn (1957–1969)', range: [1957, 1969] },
    { label: 'Apollo & Salyut (1970–1989)', range: [1970, 1989] },
    { label: 'Shuttle & Station (1990–2009)', range: [1990, 2009] },
    { label: 'Commercial & Artemis (2010–Present)', range: [2010, 2026] },
  ];

  // Scoped year cadence based on active era
  const displayedYearCadence = useMemo(() => {
    if (activeEra === 'All Eras') return yearCadence;
    const eraObj = eras.find(e => e.label === activeEra);
    if (!eraObj) return yearCadence;
    return yearCadence.filter(y => y.year >= eraObj.range[0] && y.year <= eraObj.range[1]);
  }, [yearCadence, activeEra]);

  // Selected year's statistics
  const selectedYearStat = useMemo(() => {
    return yearCadence.find(y => y.year === selectedYear) || {
      year: selectedYear,
      total: 0,
      success: 0,
      failure: 0,
      successRate: 0
    };
  }, [yearCadence, selectedYear]);

  // Missions for the selected year
  const yearMissions = useMemo(() => {
    return missions.filter(m => m.year === selectedYear);
  }, [missions, selectedYear]);

  // Available countries & vehicles for dropdown filter in selected year
  const yearCountries = useMemo(() => {
    const set = new Set<string>();
    yearMissions.forEach(m => {
      if (m.launch_country) set.add(m.launch_country);
    });
    return Array.from(set).sort();
  }, [yearMissions]);

  const yearVehicles = useMemo(() => {
    const set = new Set<string>();
    yearMissions.forEach(m => {
      if (m.launch_vehicle) set.add(m.launch_vehicle);
    });
    return Array.from(set).sort();
  }, [yearMissions]);

  // Filtered missions in selected year
  const filteredYearMissions = useMemo(() => {
    return filterMissions(yearMissions, {
      country: selectedCountry,
      vehicle: selectedVehicle,
      outcome: selectedOutcome,
      searchQuery
    });
  }, [yearMissions, selectedCountry, selectedVehicle, selectedOutcome, searchQuery]);

  // Reset pagination on filter or year change
  useEffect(() => {
    setMissionPage(1);
  }, [selectedYear, selectedCountry, selectedVehicle, selectedOutcome, searchQuery]);

  // Paginated missions
  const totalPages = Math.ceil(filteredYearMissions.length / missionsPerPage) || 1;
  const paginatedMissions = useMemo(() => {
    const start = (missionPage - 1) * missionsPerPage;
    return filteredYearMissions.slice(start, start + missionsPerPage);
  }, [filteredYearMissions, missionPage]);

  // Filtered milestones based on era
  const filteredMilestones = useMemo(() => {
    if (activeEra === 'All Eras') return TIMELINE_MILESTONES;
    const selectedEraObj = eras.find(e => e.label === activeEra);
    if (!selectedEraObj) return TIMELINE_MILESTONES;
    return TIMELINE_MILESTONES.filter(m => m.year >= selectedEraObj.range[0] && m.year <= selectedEraObj.range[1]);
  }, [activeEra]);

  const getMilestoneIcon = (iconType: string) => {
    switch (iconType) {
      case 'Radio': return <Radio className="w-4 h-4 text-[#39D5F2]" />;
      case 'User': return <User className="w-4 h-4 text-[#10B981]" />;
      case 'Moon': return <Moon className="w-4 h-4 text-[#E2E8F0]" />;
      case 'Compass': return <Compass className="w-4 h-4 text-[#F59E0B]" />;
      case 'Eye': return <Eye className="w-4 h-4 text-[#648CFF]" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-[#A78BFA]" />;
      case 'Zap': return <Zap className="w-4 h-4 text-[#39D5F2]" />;
      default: return <Rocket className="w-4 h-4 text-[#39D5F2]" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              CHRONOLOGY & EPOCHS // 1957 – 2026
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            HISTORICAL TIMELINE OF HUMAN SPACE EXPLORATION
          </h2>
          <p className="text-xs text-[#8798B3]">
            Verified year-by-year cadence, outcome breakdowns, and sovereign flight logs across 70 years of spaceflight.
          </p>
        </div>

        {/* Global Statistics Pill */}
        <div className="flex items-center gap-3 bg-[#0A1222] p-2.5 rounded-xl border border-white/10 font-mono text-xs">
          <Calendar className="w-4 h-4 text-[#39D5F2]" />
          <div>
            <div className="text-white font-semibold flex items-center gap-1.5">
              <span>7,430 LAUNCHES</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981]">93.2% SR</span>
            </div>
            <div className="text-[10px] text-[#8798B3]">70 YEARS (1957–2026)</div>
          </div>
        </div>
      </div>

      {/* Historical Era Selector & Peak Years Highlight */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {eras.map(era => (
            <button
              key={era.label}
              onClick={() => setActiveEra(era.label)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition border ${
                activeEra === era.label
                  ? 'bg-[#39D5F2]/15 border-[#39D5F2] text-white shadow-sm'
                  : 'bg-[#101B2D]/60 border-white/5 text-[#8798B3] hover:text-white hover:bg-[#101B2D]'
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>

        {/* Peak Year Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[#8798B3]">
          <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>PEAK YEARS:</span>
          {peakYears.slice(0, 3).map(p => (
            <button
              key={p.year}
              onClick={() => setSelectedYear(p.year)}
              className={`px-2 py-0.5 rounded border text-[10px] transition ${
                selectedYear === p.year
                  ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-white font-bold'
                  : 'bg-[#0A1222] border-white/10 text-[#EAF3FF] hover:border-[#F59E0B]/50'
              }`}
              title={`${p.total} launches in ${p.year} (${p.success} success, ${p.failure} failure)`}
            >
              {p.year} ({p.total})
            </button>
          ))}
        </div>
      </div>

      {/* 1. Interactive Yearly Launch Cadence & Outcomes Chart */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#39D5F2]" />
              YEAR-BY-YEAR LAUNCH FREQUENCY & OUTCOMES (1957–2026)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Hover over bars to inspect counts. Click any bar to select year and view its flight record manifest.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
              <span className="text-[#8798B3]">SUCCESS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]" />
              <span className="text-[#8798B3]">FAILURE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm border border-[#39D5F2] bg-[#39D5F2]/20" />
              <span className="text-[#39D5F2]">SELECTED ({selectedYear})</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip Info Banner on Hover */}
        <div className="h-7 px-3 rounded-lg bg-[#0A1222] border border-white/5 flex items-center justify-between font-mono text-xs">
          {hoveredYearData ? (
            <div className="flex items-center gap-4 text-white">
              <span className="text-[#39D5F2] font-bold">YEAR {hoveredYearData.year}{hoveredYearData.year === 2026 ? ' (PARTIAL)' : ''}</span>
              <span>TOTAL: <strong className="text-white">{hoveredYearData.total}</strong></span>
              <span>SUCCESS: <strong className="text-[#10B981]">{hoveredYearData.success}</strong></span>
              <span>FAILURE: <strong className="text-[#F43F5E]">{hoveredYearData.failure}</strong></span>
              <span>SUCCESS RATE: <strong className="text-[#10B981]">{hoveredYearData.successRate}%</strong></span>
            </div>
          ) : (
            <div className="text-[#8798B3] flex items-center gap-2">
              <span>SELECTED: <strong>YEAR {selectedYear}</strong></span>
              <span>•</span>
              <span>{selectedYearStat.total} Launches</span>
              <span>•</span>
              <span className="text-[#10B981]">{selectedYearStat.successRate}% Success Rate</span>
              {selectedYear === 2026 && (
                <span className="text-[#F59E0B] text-[10px] ml-2">(*2026 partial year to date)</span>
              )}
            </div>
          )}
          <span className="text-[10px] text-[#8798B3] hidden sm:inline">CLICK A BAR TO VIEW MISSION ROSTER</span>
        </div>

        {/* Bar Visualizer */}
        <div className="relative pt-4 pb-2 overflow-x-auto">
          <div className="flex items-end gap-1.5 min-w-[760px] h-48 px-1">
            {displayedYearCadence.map(stat => {
              const heightPercent = (stat.total / maxYearLaunches) * 100;
              const successPercent = stat.total > 0 ? (stat.success / stat.total) * 100 : 0;
              const isSelected = selectedYear === stat.year;
              const is2026 = stat.year === 2026;

              return (
                <div
                  key={stat.year}
                  onClick={() => setSelectedYear(stat.year)}
                  onMouseEnter={() => setHoveredYearData(stat)}
                  onMouseLeave={() => setHoveredYearData(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Top indicator tag for peak or selected */}
                  <div className="text-[9px] font-mono mb-1 h-3 text-center">
                    {isSelected ? (
                      <span className="text-[#39D5F2] font-bold">▼</span>
                    ) : stat.year === 2025 ? (
                      <span className="text-[#F59E0B] font-bold" title="All-time peak: 329 launches">★</span>
                    ) : is2026 ? (
                      <span className="text-[#F59E0B] text-[8px]" title="Partial year: 268 launches">*</span>
                    ) : null}
                  </div>

                  {/* Stacked Bar (Success / Failure) */}
                  <div 
                    className={`w-full rounded-t transition-all relative overflow-hidden flex flex-col justify-end ${
                      isSelected 
                        ? 'ring-2 ring-[#39D5F2] shadow-[0_0_12px_rgba(57,213,242,0.4)]' 
                        : 'group-hover:opacity-90'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  >
                    {/* Failure part (top) */}
                    <div 
                      className="w-full bg-[#F43F5E] transition-all" 
                      style={{ height: `${100 - successPercent}%` }}
                    />
                    {/* Success part (bottom) */}
                    <div 
                      className="w-full bg-[#10B981] transition-all" 
                      style={{ height: `${successPercent}%` }}
                    />
                  </div>

                  {/* Year Label */}
                  <span className={`text-[9px] font-mono mt-1.5 transform -rotate-45 origin-left transition ${
                    isSelected ? 'text-[#39D5F2] font-bold' : 'text-[#8798B3] group-hover:text-white'
                  }`}>
                    {stat.year % 5 === 0 || stat.year === 1957 || stat.year === 2026 ? stat.year : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Real Decade Launch Volumes & Success Rate Grid */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39D5F2]" />
            DECADE-BY-DECADE HISTORICAL CADENCE (CLEANED DATASET)
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">8 HISTORIC DECADES</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {decadeCadence.map(d => (
            <div 
              key={d.decade} 
              className={`p-3 rounded-xl border space-y-2 transition ${
                Math.floor(selectedYear / 10) * 10 === parseInt(d.decade, 10)
                  ? 'bg-[#101B2D] border-[#39D5F2]/40 shadow-sm'
                  : 'bg-[#0A1222]/80 border-white/5'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold text-[#39D5F2]">{d.decade}</span>
                {d.decade === '2020s' && (
                  <span className="text-[8px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1 rounded">ONGOING</span>
                )}
              </div>
              <div className="text-lg font-bold text-white font-mono">{d.total.toLocaleString()}</div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-[#10B981] h-full" 
                  style={{ width: `${d.successRate}%` }} 
                  title={`Success: ${d.success}`}
                />
                <div 
                  className="bg-[#F43F5E] h-full" 
                  style={{ width: `${100 - d.successRate}%` }} 
                  title={`Failure: ${d.failure}`}
                />
              </div>

              <div className="text-[10px] font-mono text-[#8798B3] flex justify-between">
                <span>SR:</span>
                <span className="text-[#10B981] font-semibold">{d.successRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Selected Year Deep Mission Manifest & Table */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="w-4 h-4 text-[#39D5F2]" />
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                YEAR {selectedYear} MISSION MANIFEST ({yearMissions.length} LAUNCHES RECORDED)
              </h3>
            </div>
            {selectedYear === 2026 && (
              <p className="text-[11px] font-mono text-[#F59E0B] mt-0.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Notice: 2026 data represents missions to date (January–February 2026) and is not a complete annual cycle.</span>
              </p>
            )}
          </div>

          {/* Quick Metrics for Selected Year */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-[#0A1222] border border-white/5">
              <span className="text-[#8798B3] text-[10px] block">SUCCESSFUL</span>
              <span className="text-[#10B981] font-bold">{selectedYearStat.success}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-[#0A1222] border border-white/5">
              <span className="text-[#8798B3] text-[10px] block">FAILURES</span>
              <span className="text-[#F43F5E] font-bold">{selectedYearStat.failure}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-[#0A1222] border border-white/5">
              <span className="text-[#8798B3] text-[10px] block">RATE</span>
              <span className="text-white font-bold">{selectedYearStat.successRate}%</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8798B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mission / vehicle / agency..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white placeholder-[#8798B3] font-mono focus:outline-none focus:border-[#39D5F2]"
            />
          </div>

          {/* Country filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Sovereign States ({yearCountries.length})</option>
              {yearCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Vehicle filter */}
          <div>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Launch Vehicles ({yearVehicles.length})</option>
              {yearVehicles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Outcome filter */}
          <div>
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Outcomes</option>
              <option value="Success">Success Only</option>
              <option value="Failure">Failure Only</option>
            </select>
          </div>
        </div>

        {/* Real Mission Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Date / Flight Tag</th>
                <th className="pb-2">Mission Payload</th>
                <th className="pb-2">Launch Vehicle</th>
                <th className="pb-2">Agency / Operator</th>
                <th className="pb-2">Sovereign State</th>
                <th className="pb-2">Spaceport Complex</th>
                <th className="pb-2 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#8798B3]">
                    No missions match the selected filters for year {selectedYear}.
                  </td>
                </tr>
              ) : (
                paginatedMissions.map((m) => (
                  <tr 
                    key={m.launch_tag} 
                    onClick={() => setSelectedMission(m)}
                    className="hover:bg-[#14233D] transition cursor-pointer group"
                  >
                    <td className="py-2.5 font-semibold text-white">
                      <div>{m.date || `Year ${m.year}`}</div>
                      <div className="text-[10px] text-[#8798B3] group-hover:text-[#39D5F2] transition">
                        {m.launch_tag}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <div className="font-semibold text-white text-xs">
                        {m.mission || m.flight || m.launch_vehicle}
                      </div>
                      <div className="text-[10px] text-[#8798B3]">
                        {m.launch_class}
                      </div>
                    </td>
                    <td className="py-2.5 text-[#39D5F2] font-semibold">
                      {m.launch_vehicle}
                    </td>
                    <td className="py-2.5 text-[#EAF3FF]">
                      {m.agency || 'N/A'}
                    </td>
                    <td className="py-2.5 text-[#8798B3]">
                      {m.launch_country || m.site_country}
                    </td>
                    <td className="py-2.5 text-[#8798B3]">
                      {m.launch_site}{m.launch_pad ? ` (${m.launch_pad})` : ''}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        m.outcome === 'Success'
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                      }`}>
                        {m.outcome === 'Success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{m.outcome}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-white/5 font-mono text-xs text-[#8798B3]">
            <span>
              Showing {((missionPage - 1) * missionsPerPage) + 1}–{Math.min(missionPage * missionsPerPage, filteredYearMissions.length)} of {filteredYearMissions.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMissionPage(prev => Math.max(prev - 1, 1))}
                disabled={missionPage === 1}
                className="p-1 rounded bg-[#0A1222] border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2">
                Page {missionPage} of {totalPages}
              </span>
              <button
                onClick={() => setMissionPage(prev => Math.min(prev + 1, totalPages))}
                disabled={missionPage === totalPages}
                className="p-1 rounded bg-[#0A1222] border border-white/10 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Chronological Milestones Feed & Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chronological Feed */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#A78BFA]" />
              CURATED HISTORICAL MILESTONES ({filteredMilestones.length})
            </h3>
            <span className="text-[10px] font-mono text-[#8798B3]">CLICK TO INSPECT</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#39D5F2]/20">
            {filteredMilestones.map((m) => {
              const isSelected = selectedMilestone.title === m.title;

              return (
                <div
                  key={m.title}
                  onClick={() => setSelectedMilestone(m)}
                  className={`relative p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#101B2D] border-[#39D5F2]/50 shadow-glow-cyan'
                      : 'bg-[#101B2D]/40 border-white/5 hover:border-white/20 hover:bg-[#101B2D]/80'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[27px] top-4 w-3.5 h-3.5 rounded-full border-2 transition ${
                    isSelected 
                      ? 'bg-[#39D5F2] border-[#0A1222] shadow-[0_0_8px_#39D5F2]' 
                      : 'bg-[#0A1222] border-[#39D5F2]/50'
                  }`} />

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-white/5">
                        {getMilestoneIcon(m.iconType)}
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {m.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#39D5F2] bg-[#39D5F2]/10 px-2 py-0.5 rounded">
                      {m.year}
                    </span>
                  </div>

                  <p className="text-xs text-[#8798B3] leading-relaxed">
                    {m.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8798B3] pt-2 mt-2 border-t border-white/5">
                    <span>{m.agency} • {m.country}</span>
                    <span className="text-white/60">{m.vehicle}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Milestone Dossier */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-[#39D5F2]" />
                MILESTONE DOSSIER
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/30">
                {selectedMilestone.significance.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-xs font-mono text-[#39D5F2]">{selectedMilestone.date}</span>
              <h3 className="text-xl font-display font-bold text-white mt-1">
                {selectedMilestone.title}
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-[#0A1222]/80 border border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block">
                MISSION SIGNIFICANCE
              </span>
              <p className="text-xs text-[#EAF3FF] leading-relaxed">
                {selectedMilestone.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">OPERATING AGENCY</span>
                <span className="font-semibold text-white">{selectedMilestone.agency}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">SOVEREIGN STATE</span>
                <span className="font-semibold text-white">{selectedMilestone.country}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">LAUNCH VEHICLE</span>
                <span className="font-semibold text-[#39D5F2]">{selectedMilestone.vehicle}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">HISTORIC CATEGORY</span>
                <span className="font-semibold text-[#A78BFA]">{selectedMilestone.significance}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5 text-[11px] font-mono text-[#8798B3] text-center">
            CANONICAL ARCHIVES // 7,430 TOTAL FLIGHTS CROSS-REFERENCED
          </div>
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

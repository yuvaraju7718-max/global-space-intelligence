import React, { useState, useEffect, useMemo } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Globe2, 
  Building2, 
  TrendingUp, 
  Compass, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { InteractiveGlobe } from '../../components/Globe/InteractiveGlobe';
import { ActivityAreaChart } from '../../components/Charts/ActivityAreaChart';
import { OutcomesDonutChart } from '../../components/Charts/OutcomesDonutChart';
import { CountryBarChart } from '../../components/Charts/CountryBarChart';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';
import { LAUNCH_SITES } from '../../data/spaceData';
import { LaunchSite, FilterState, CleanedMissionRecord } from '../../types';
import { 
  loadCleanedSpaceMissions,
  calculateSummaryStats,
  calculateDecadeCadence,
  calculateCountryStats,
  calculateLaunchSiteStats
} from '../../services/dataService';

interface OverviewPageProps {
  filters: FilterState;
  onNavigateToExplorer: () => void;
  onNavigateToAnalytics: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  filters,
  onNavigateToExplorer,
  onNavigateToAnalytics,
}) => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSite, setSelectedSite] = useState<LaunchSite>(LAUNCH_SITES[0]);
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);
  const [tablePage, setTablePage] = useState<number>(1);
  const pageSize = 7;

  // 1. Fetch real dataset on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    loadCleanedSpaceMissions()
      .then((records) => {
        if (isMounted) {
          setMissions(records);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load space missions dataset');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Filter missions dynamically based on global filter state
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      // Year range filter
      if (m.year < filters.yearRange[0] || m.year > filters.yearRange[1]) {
        return false;
      }

      // Country filter
      if (filters.selectedCountry !== 'All') {
        const countryMatch = 
          m.launch_country === filters.selectedCountry || 
          m.site_country === filters.selectedCountry;
        if (!countryMatch) return false;
      }

      // Mission Type / Launch Class filter
      if (filters.selectedType !== 'All') {
        if (filters.selectedType === 'Deep space' && m.launch_class !== 'Deep space') return false;
        if (filters.selectedType === 'Orbital' && m.launch_class !== 'Orbital') return false;
      }

      // Status filter
      if (filters.selectedStatus !== 'All') {
        if (m.outcome !== filters.selectedStatus) return false;
      }

      // Global search query filter
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesQuery =
          (m.mission && m.mission.toLowerCase().includes(q)) ||
          (m.flight && m.flight.toLowerCase().includes(q)) ||
          m.launch_vehicle.toLowerCase().includes(q) ||
          m.agency.toLowerCase().includes(q) ||
          m.launch_site.toLowerCase().includes(q) ||
          m.launch_country.toLowerCase().includes(q) ||
          m.launch_tag.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [missions, filters]);

  // 3. Compute statistical aggregates using data service functions
  const summaryStats = useMemo(() => calculateSummaryStats(filteredMissions), [filteredMissions]);
  const decadeData = useMemo(() => calculateDecadeCadence(filteredMissions), [filteredMissions]);
  const countryData = useMemo(() => calculateCountryStats(filteredMissions), [filteredMissions]);
  const launchSiteStats = useMemo(() => calculateLaunchSiteStats(filteredMissions), [filteredMissions]);

  // Real-time lookup for the selected site on the globe
  const selectedSiteRealStats = useMemo(() => {
    if (!selectedSite) return null;
    return launchSiteStats.find(s => 
      s.siteName.toLowerCase().includes(selectedSite.name.toLowerCase().split(' ')[0]) ||
      selectedSite.name.toLowerCase().includes(s.siteName.toLowerCase().split(' ')[0])
    ) || null;
  }, [selectedSite, launchSiteStats]);

  // Paginated records for the flight operations log
  const totalTablePages = Math.ceil(filteredMissions.length / pageSize) || 1;
  const currentTableRecords = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredMissions.slice(start, start + pageSize);
  }, [filteredMissions, tablePage]);

  // Reset page if filters change
  useEffect(() => {
    setTablePage(1);
  }, [filters]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 className="w-8 h-8 text-[#39D5F2] animate-spin" />
        <div className="text-white font-semibold tracking-wider">
          INITIALIZING TELEMETRY STREAM & CANONICAL DATA ENGINE...
        </div>
        <div className="text-[#8798B3] text-[11px]">
          Parsing 7,430 verified orbital flight records from dataset
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[#0A1222] border border-[#F43F5E]/40 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[#F43F5E] font-bold">
          <AlertCircle className="w-5 h-5" />
          <span>DATASET CONNECTION ERROR</span>
        </div>
        <p className="text-[#8798B3]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-white hover:bg-[#F43F5E]/25 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RETRY TELEMETRY LINK</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Executive Telemetry Row (6 High-Density KPI Cards Powered by Real Data) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Missions */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">TOTAL LAUNCHES</span>
            <Rocket className="w-4 h-4 text-[#39D5F2]" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            {summaryStats.totalLaunches.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#39D5F2]">
            <TrendingUp className="w-3 h-3" />
            <span>{summaryStats.yearMax} Latest Data</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#39D5F2] to-transparent opacity-70" />
        </div>

        {/* Successful Missions */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">SUCCESSFUL</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-2xl font-display font-bold text-[#10B981] tracking-tight">
            {summaryStats.successfulLaunches.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#8798B3]">
            <span>Nominal payload delivery</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#10B981] to-transparent opacity-70" />
        </div>

        {/* Failed Missions */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">FAILURES</span>
            <XCircle className="w-4 h-4 text-[#F43F5E]" />
          </div>
          <div className="text-2xl font-display font-bold text-[#F43F5E] tracking-tight">
            {summaryStats.failedLaunches.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#8798B3]">
            <span>
              {summaryStats.totalLaunches > 0 
                ? `${((summaryStats.failedLaunches / summaryStats.totalLaunches) * 100).toFixed(1)}% anomaly rate` 
                : '0.0% anomaly rate'}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#F43F5E] to-transparent opacity-70" />
        </div>

        {/* Mission Success Rate */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">SUCCESS RATE</span>
            <Percent className="w-4 h-4 text-[#39D5F2]" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            {summaryStats.successRate}<span className="text-sm text-[#39D5F2] font-mono">%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#39D5F2] h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(0, summaryStats.successRate))}%` }} 
            />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#39D5F2] to-transparent opacity-70" />
        </div>

        {/* Spacefaring Nations */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">SOVEREIGN NATIONS</span>
            <Globe2 className="w-4 h-4 text-[#648CFF]" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            {summaryStats.uniqueCountries}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#648CFF]">
            <span>Sovereign launch flags</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#648CFF] to-transparent opacity-70" />
        </div>

        {/* Space Agencies */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">ACTIVE AGENCIES</span>
            <Building2 className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div className="text-2xl font-display font-bold text-[#A78BFA] tracking-tight">
            {summaryStats.uniqueAgencies}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#8798B3]">
            <span>Gov & Commercial entities</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#A78BFA] to-transparent opacity-70" />
        </div>
      </div>

      {/* 2. Hero Interactive Command Center (3D Earth + Mission Intelligence Side Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Interactive Earth (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#39D5F2] shadow-[0_0_8px_#39D5F2]" />
              <h2 className="text-sm font-display font-bold text-white tracking-wide uppercase">
                GLOBAL ORBITAL PROJECTION & SPACEPORTS
              </h2>
            </div>
            <span className="text-[11px] font-mono text-[#8798B3]">
              CLICK PINS TO INSPECT TELEMETRY
            </span>
          </div>

          <div className="flex-1 min-h-[460px] w-full">
            <InteractiveGlobe 
              selectedSiteId={selectedSite?.id} 
              onSelectSite={(site) => setSelectedSite(site)} 
            />
          </div>
        </div>

        {/* Right: Selected Complex / Mission Intelligence Telemetry (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-panel p-5 rounded-2xl space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#39D5F2]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  SPACEPORT TELEMETRY
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold">
                ACTIVE
              </span>
            </div>

            {selectedSite ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    {selectedSite.name}
                  </h3>
                  <p className="text-xs font-mono text-[#39D5F2]">
                    {selectedSiteRealStats?.country || selectedSite.country}
                  </p>
                </div>

                <p className="text-xs text-[#8798B3] leading-relaxed">
                  {selectedSite.description}
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">TOTAL LAUNCHES</span>
                    <span className="text-lg font-bold text-white">
                      {selectedSiteRealStats ? selectedSiteRealStats.totalLaunches.toLocaleString() : selectedSite.totalLaunches.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">SUCCESS RATE</span>
                    <span className="text-lg font-bold text-[#10B981]">
                      {selectedSiteRealStats ? `${selectedSiteRealStats.successRate}%` : `${selectedSite.successRate}%`}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0A1222]/80 border border-white/5 space-y-1.5 font-mono text-xs">
                  <span className="text-[10px] text-[#8798B3] uppercase tracking-wider block">COORDINATES</span>
                  <div className="text-[#39D5F2] font-semibold">
                    {selectedSite.coordinates[0].toFixed(4)}° N, {selectedSite.coordinates[1].toFixed(4)}° E
                  </div>
                  <div className="text-[11px] text-[#8798B3] pt-1 border-t border-white/5">
                    Operators: {selectedSite.primaryOperators.join(', ')}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block mb-1.5">
                    KEY LAUNCH PADS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSite.notablePads.map(pad => (
                      <span key={pad} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-[#EAF3FF]">
                        {pad}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8798B3] font-mono">
                Select a launch site on the globe to inspect its telemetry.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={onNavigateToExplorer}
              className="w-full py-2.5 px-4 rounded-xl bg-[#39D5F2]/10 hover:bg-[#39D5F2]/20 border border-[#39D5F2]/30 text-xs font-mono font-semibold text-[#39D5F2] flex items-center justify-center gap-2 transition"
            >
              <span>OPEN FULL GEOGRAPHIC ATLAS</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Analytics Below Hero (Real Decade Cadence Area Chart, Outcomes Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Global Mission Activity Over Time (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <ActivityAreaChart data={decadeData} />
        </div>

        {/* Right: Outcomes Donut Chart (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              MISSION OUTCOME TAXONOMY
            </h4>
            <span className="text-[10px] font-mono text-[#8798B3]">CANONICAL DATASET</span>
          </div>
          <OutcomesDonutChart 
            successCount={summaryStats.successfulLaunches} 
            failureCount={summaryStats.failedLaunches} 
          />
        </div>
      </div>

      {/* 4. Sovereign Nations Volume & Real Flight Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Country-wise distribution (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#39D5F2]" />
              SOVEREIGN LAUNCH VOLUME
            </h4>
            <span className="text-[10px] font-mono text-[#8798B3]">ACTUAL DATASET</span>
          </div>
          <CountryBarChart countries={countryData} />
        </div>

        {/* Real Flight Operations Log Table (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#A78BFA]" />
                FLIGHT OPERATIONS LOG ({filteredMissions.length.toLocaleString()} MISSIONS)
              </h4>
              <button 
                onClick={onNavigateToAnalytics}
                className="text-[11px] font-mono text-[#39D5F2] hover:underline flex items-center gap-1"
              >
                <span>VIEW FULL ANALYTICS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto min-h-[310px]">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                    <th className="pb-2">Mission / Flight</th>
                    <th className="pb-2">Agency</th>
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Domain</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentTableRecords.map((m) => (
                    <tr 
                      key={m.launch_tag} 
                      onClick={() => setSelectedMission(m)}
                      className="hover:bg-[#14233D] transition cursor-pointer group"
                    >
                      <td className="py-2.5 font-sans font-semibold text-white group-hover:text-[#39D5F2] transition flex items-center gap-2">
                        <span className="truncate max-w-[150px]" title={m.mission || m.flight || m.launch_vehicle}>
                          {m.mission || m.flight || m.launch_vehicle}
                        </span>
                        <span className="text-[9px] font-mono text-[#8798B3]/60 px-1 rounded bg-white/5">
                          {m.launch_tag}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#8798B3] truncate max-w-[100px]" title={m.agency}>
                        {m.agency}
                      </td>
                      <td className="py-2.5 text-white/80 truncate max-w-[110px]" title={m.launch_vehicle}>
                        {m.launch_vehicle}
                      </td>
                      <td className="py-2.5 text-[#39D5F2]">{m.launch_class}</td>
                      <td className="py-2.5 text-[#8798B3]">{m.date}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.outcome === 'Success' 
                            ? 'bg-[#10B981]/15 text-[#10B981]' 
                            : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                        }`}>
                          {m.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination & Legend */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#8798B3]">
            <span>
              Showing {((tablePage - 1) * pageSize) + 1}–{Math.min(tablePage * pageSize, filteredMissions.length)} of {filteredMissions.length.toLocaleString()}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
                disabled={tablePage === 1}
                className="p-1 rounded-lg bg-[#0A1222] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#101B2D]"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-white px-1">
                {tablePage} / {totalTablePages}
              </span>
              <button
                onClick={() => setTablePage(prev => Math.min(prev + 1, totalTablePages))}
                disabled={tablePage === totalTablePages}
                className="p-1 rounded-lg bg-[#0A1222] border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#101B2D]"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Detail Modal */}
      <MissionDetailModal
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
      />
    </div>
  );
};

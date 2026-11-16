import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  XCircle, 
  Percent, 
  Globe2, 
  Building2, 
  Layers, 
  TrendingUp, 
  Compass, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { InteractiveGlobe } from '../../components/Globe/InteractiveGlobe';
import { ActivityAreaChart } from '../../components/Charts/ActivityAreaChart';
import { OutcomesDonutChart } from '../../components/Charts/OutcomesDonutChart';
import { CountryBarChart } from '../../components/Charts/CountryBarChart';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';
import { LAUNCH_SITES, SAMPLE_MISSIONS } from '../../data/spaceData';
import { LaunchSite, SpaceMission, FilterState } from '../../types';

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
  const [selectedSite, setSelectedSite] = useState<LaunchSite>(LAUNCH_SITES[0]);
  const [selectedMission, setSelectedMission] = useState<SpaceMission | null>(null);

  // Filter missions based on top header state
  const filteredMissions = SAMPLE_MISSIONS.filter(m => {
    if (filters.selectedCountry !== 'All' && m.country !== filters.selectedCountry) return false;
    if (filters.selectedType !== 'All' && m.payloadType !== filters.selectedType) return false;
    if (m.year < filters.yearRange[0] || m.year > filters.yearRange[1]) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Executive Telemetry Row (6 High-Density KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total Missions */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">TOTAL MISSIONS</span>
            <Rocket className="w-4 h-4 text-[#39D5F2]" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            4,682
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#39D5F2]">
            <TrendingUp className="w-3 h-3" />
            <span>+142 in 2024</span>
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
            4,198
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#8798B3]">
            <span>Nominal payload delivery</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#10B981] to-transparent opacity-70" />
        </div>

        {/* Failed Missions */}
        <div className="space-panel p-4 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8798B3] mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">FAILURES / PARTIAL</span>
            <XCircle className="w-4 h-4 text-[#F43F5E]" />
          </div>
          <div className="text-2xl font-display font-bold text-[#F43F5E] tracking-tight">
            484
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#8798B3]">
            <span>10.3% historical anomaly</span>
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
            89.6<span className="text-sm text-[#39D5F2] font-mono">%</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#39D5F2] h-full rounded-full" style={{ width: '89.6%' }} />
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
            38
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-[#648CFF]">
            <span>12 autonomous launchers</span>
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
            142
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
                    {selectedSite.country}
                  </p>
                </div>

                <p className="text-xs text-[#8798B3] leading-relaxed">
                  {selectedSite.description}
                </p>

                <div className="grid grid-cols-2 gap-2.5 pt-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">TOTAL LAUNCHES</span>
                    <span className="text-lg font-bold text-white">{selectedSite.totalLaunches}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">SUCCESS RATE</span>
                    <span className="text-lg font-bold text-[#10B981]">{selectedSite.successRate}%</span>
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

      {/* 3. Analytics Below Hero (Time Cadence Area, Country Distribution, Outcomes Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Global Mission Activity Over Time (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <ActivityAreaChart />
        </div>

        {/* Right: Outcomes Donut Chart (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              MISSION OUTCOME TAXONOMY
            </h4>
            <span className="text-[10px] font-mono text-[#8798B3]">GLOBAL STATS</span>
          </div>
          <OutcomesDonutChart />
        </div>
      </div>

      {/* 4. Sovereign Nations Volume & Recent Flight Records */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Country-wise distribution (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#39D5F2]" />
              SOVEREIGN SPACE PROGRAM VOLUME
            </h4>
            <span className="text-[10px] font-mono text-[#8798B3]">RANKED</span>
          </div>
          <CountryBarChart />
        </div>

        {/* Recent Significant Missions Table (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#A78BFA]" />
                FLIGHT OPERATIONS LOG ({filteredMissions.length} RECORDED)
              </h4>
              <button 
                onClick={onNavigateToAnalytics}
                className="text-[11px] font-mono text-[#39D5F2] hover:underline flex items-center gap-1"
              >
                <span>VIEW FULL ANALYTICS</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                    <th className="pb-2">Mission</th>
                    <th className="pb-2">Agency</th>
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Orbit</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMissions.slice(0, 6).map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMission(m)}
                      className="hover:bg-[#14233D] transition cursor-pointer group"
                    >
                      <td className="py-2.5 font-sans font-semibold text-white group-hover:text-[#39D5F2] transition flex items-center gap-2">
                        {m.name}
                      </td>
                      <td className="py-2.5 text-[#8798B3]">{m.agency}</td>
                      <td className="py-2.5 text-white/80">{m.vehicle}</td>
                      <td className="py-2.5 text-[#39D5F2]">{m.orbit}</td>
                      <td className="py-2.5 text-[#8798B3]">{m.launchDate}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.status === 'Success' 
                            ? 'bg-[#10B981]/15 text-[#10B981]' 
                            : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#8798B3]">
            <span>Showing verified orbital launches</span>
            <span>Click any mission row for telemetry spec</span>
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

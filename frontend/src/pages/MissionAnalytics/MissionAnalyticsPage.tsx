import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Rocket, 
  Globe2, 
  Radio, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  PieChart, 
  Target,
  Weight,
  Compass,
  ArrowUpRight,
  Filter,
  Search,
  AlertTriangle,
  Flame,
  Info,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  CleanedMissionRecord, 
  FilterState, 
  MissionAnalyticsData,
  VehicleDetailedStat 
} from '../../types';
import { 
  loadCleanedSpaceMissions, 
  calculateMissionAnalytics, 
  filterMissions 
} from '../../services/dataService';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';

interface MissionAnalyticsPageProps {
  filters: FilterState;
}

export const MissionAnalyticsPage: React.FC<MissionAnalyticsPageProps> = () => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('All');

  // Interactive selection state
  const [inspectedVehicle, setInspectedVehicle] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);
  const [hoveredScatterPoint, setHoveredScatterPoint] = useState<any | null>(null);

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

  // Filter options derived from real dataset
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    missions.forEach(m => {
      if (m.launch_country) set.add(m.launch_country);
    });
    return Array.from(set).sort();
  }, [missions]);

  const availableVehicles = useMemo(() => {
    const set = new Set<string>();
    missions.forEach(m => {
      if (m.launch_vehicle) set.add(m.launch_vehicle);
    });
    return Array.from(set).sort();
  }, [missions]);

  // Filtered dataset
  const filteredMissions = useMemo(() => {
    return filterMissions(missions, {
      country: selectedCountry,
      vehicle: selectedVehicle,
      outcome: selectedOutcome,
      searchQuery
    }).filter(m => {
      if (selectedClass !== 'All' && m.launch_class !== selectedClass) return false;
      return true;
    });
  }, [missions, selectedCountry, selectedVehicle, selectedClass, selectedOutcome, searchQuery]);

  // Scientific analytics calculated from active filtered dataset
  const analytics: MissionAnalyticsData = useMemo(() => {
    return calculateMissionAnalytics(filteredMissions);
  }, [filteredMissions]);

  // If a vehicle is inspected, get its missions
  const inspectedVehicleMissions = useMemo(() => {
    if (!inspectedVehicle) return [];
    return filteredMissions
      .filter(m => m.launch_vehicle.toLowerCase() === inspectedVehicle.toLowerCase())
      .slice(0, 10);
  }, [filteredMissions, inspectedVehicle]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              SCIENTIFIC FLIGHT DYNAMICS // CANONICAL DATASET
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            MISSION ANALYTICS, ORBITAL DYNAMICS & VEHICLE SPECS
          </h2>
          <p className="text-xs text-[#8798B3]">
            Rigorous statistical analysis of payload tonnage, apogee/perigee trajectories, orbital inclination clusters, and booster reliability.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#0A1222] p-2.5 rounded-xl border border-white/10 font-mono text-xs">
          <Weight className="w-4 h-4 text-[#39D5F2]" />
          <div>
            <div className="text-white font-semibold">
              <span className="text-[#39D5F2]">{analytics.payloadMass.totalMassT.toLocaleString()} TONNES</span>
            </div>
            <div className="text-[10px] text-[#8798B3]">{filteredMissions.length.toLocaleString()} MISSIONS EVALUATED</div>
          </div>
        </div>
      </div>

      {/* Dynamic Scientific Insight Cards (Step 7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Most Frequent Booster */}
        <div className="p-4 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8798B3] uppercase">PRIMARY VEHICLE BY CADENCE</span>
            <Rocket className="w-3.5 h-3.5 text-[#39D5F2]" />
          </div>
          <div className="text-base font-bold text-white truncate">
            {analytics.topVehicles[0]?.vehicle || 'N/A'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#39D5F2] font-semibold">{analytics.topVehicles[0]?.total || 0} flights</span>
            <span className="text-[#10B981]">{analytics.topVehicles[0]?.successRate || 0}% SR</span>
          </div>
        </div>

        {/* Card 2: Highest Payload Mass */}
        <div className="p-4 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8798B3] uppercase">MAX RECORDED PAYLOAD MASS</span>
            <Weight className="w-3.5 h-3.5 text-[#A78BFA]" />
          </div>
          <div className="text-base font-bold text-white">
            {analytics.payloadMass.maxMassT.toLocaleString()} Metric Tonnes
          </div>
          <div className="text-[11px] font-mono text-[#8798B3] truncate">
            {analytics.payloadMass.topHeaviestMissions[0]?.mission || 'Space Shuttle STS'} ({analytics.payloadMass.topHeaviestMissions[0]?.vehicle || 'Shuttle'})
          </div>
        </div>

        {/* Card 3: Median Payload Mass */}
        <div className="p-4 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8798B3] uppercase">MEDIAN PAYLOAD TONNAGE</span>
            <BarChart3 className="w-3.5 h-3.5 text-[#10B981]" />
          </div>
          <div className="text-base font-bold text-white">
            {analytics.payloadMass.medianMassT} t
          </div>
          <div className="text-[11px] font-mono text-[#8798B3]">
            Mean: <strong className="text-white">{analytics.payloadMass.averageMassT} t</strong> across {analytics.payloadMass.validCount.toLocaleString()} flights
          </div>
        </div>

        {/* Card 4: Trajectory & Inclination */}
        <div className="p-4 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8798B3] uppercase">MEDIAN INSERTION ALTITUDE</span>
            <Target className="w-3.5 h-3.5 text-[#648CFF]" />
          </div>
          <div className="text-base font-bold text-white">
            {analytics.orbitalTrajectory.apogee.medianKm.toLocaleString()} km Apogee
          </div>
          <div className="text-[11px] font-mono text-[#8798B3]">
            Median Perigee: <strong className="text-white">{analytics.orbitalTrajectory.perigee.medianKm} km</strong> | Inc: <strong className="text-white">{analytics.orbitalTrajectory.inclination.medianDeg}°</strong>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Interactive Filter Controls (Step 6) */}
      <div className="space-panel p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#39D5F2]" />
            SCIENTIFIC PARAMETER FILTERS ({filteredMissions.length.toLocaleString()} OF {missions.length.toLocaleString()} MATCHING)
          </span>

          {(selectedCountry !== 'All' || selectedVehicle !== 'All' || selectedClass !== 'All' || selectedOutcome !== 'All' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedCountry('All');
                setSelectedVehicle('All');
                setSelectedClass('All');
                setSelectedOutcome('All');
                setSearchQuery('');
              }}
              className="text-[10px] font-mono text-[#39D5F2] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8798B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mission / payload / vehicle..."
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
              <option value="All">All Sovereign States ({availableCountries.length})</option>
              {availableCountries.map(c => (
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
              <option value="All">All Launch Vehicles ({availableVehicles.length})</option>
              {availableVehicles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Mission Class filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Mission Classes</option>
              <option value="Orbital">Orbital Only (7,201)</option>
              <option value="Deep space">Deep Space Only (229)</option>
            </select>
          </div>

          {/* Outcome filter */}
          <div>
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#0A1222] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#39D5F2]"
            >
              <option value="All">All Launch Outcomes</option>
              <option value="Success">Success Only</option>
              <option value="Failure">Failure Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1. Payload Mass Analysis (Step 2) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Weight className="w-4 h-4 text-[#39D5F2]" />
              PAYLOAD MASS SPECTRUM & AEROSPACE LIFT CLASSES (payload_mass_t)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Quantized into standard payload categories to prevent outlier distortion from super-heavy crew vehicles.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#8798B3]">TOTAL MASS LIFTED:</span>
            <span className="text-[#39D5F2] font-bold">{analytics.payloadMass.totalMassT.toLocaleString()} t</span>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {analytics.payloadMass.massBuckets.map(b => (
            <div key={b.category} className="p-3.5 rounded-xl bg-[#0A1222] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate">{b.category}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#39D5F2]">
                  {b.percent}%
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#8798B3]">
                RANGE: <strong className="text-white">{b.rangeLabel}</strong>
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {b.count.toLocaleString()} <span className="text-xs font-normal text-[#8798B3]">flights</span>
              </div>

              {/* Bar indicator */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${b.percent}%`, backgroundColor: b.color }} 
                />
              </div>
            </div>
          ))}
        </div>

        {/* Dual Panels: Top Countries by Mass & Heaviest Historical Payloads */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: Top Countries by Total Mass Lifted (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              TOTAL TONNAGE LIFTED BY SOVEREIGN STATE
            </span>
            <div className="space-y-1.5">
              {analytics.payloadMass.countryMassBreakdown.map(c => {
                const maxCountryMass = analytics.payloadMass.countryMassBreakdown[0]?.totalMassT || 1;
                const percent = (c.totalMassT / maxCountryMass) * 100;

                return (
                  <div key={c.country} className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-white font-semibold">{c.country}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[#8798B3]">{c.count} flights</span>
                        <span className="text-[#39D5F2] font-bold">{c.totalMassT.toLocaleString()} t</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#39D5F2] h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-[#8798B3] flex justify-between">
                      <span>Avg per launch: {c.averageMassT} t</span>
                      <span>Max single payload: {c.maxMassT} t</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Heaviest Historical Flights (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
              HEAVIEST RECORDED ORBITAL FLIGHTS (HISTORICAL PEAKS)
            </span>
            <div className="space-y-2">
              {analytics.payloadMass.topHeaviestMissions.map((m, idx) => (
                <div 
                  key={m.launchTag}
                  onClick={() => {
                    const found = missions.find(r => r.launch_tag === m.launchTag);
                    if (found) setSelectedMission(found);
                  }}
                  className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5 hover:border-[#39D5F2]/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-[#A78BFA]/15 text-[#A78BFA] font-mono font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white truncate max-w-[220px]">
                        {m.mission}
                      </div>
                      <div className="text-[10px] font-mono text-[#8798B3]">
                        {m.date} • {m.vehicle} ({m.country})
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-[#39D5F2] block">
                      {m.massT.toLocaleString()} t
                    </span>
                    <span className="text-[10px] font-mono text-[#10B981]">
                      {m.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Orbital & Trajectory Analysis (Step 3) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#39D5F2]" />
              ORBITAL REGIMES, ALTITUDE & INCLINATION CLUSTERS
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Statistical distribution of apogee (km), perigee (km), and orbital inclination angles (degrees).
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#8798B3]">APOGEE MEDIAN:</span>
            <span className="text-[#39D5F2] font-bold">{analytics.orbitalTrajectory.apogee.medianKm.toLocaleString()} km</span>
          </div>
        </div>

        {/* Altitude Regimes & Inclination Clusters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Apogee Regimes (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                APOGEE ALTITUDE REGIMES ({analytics.orbitalTrajectory.apogee.validCount.toLocaleString()} MEASURED)
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">apogee_km</span>
            </div>

            <div className="space-y-2">
              {analytics.orbitalTrajectory.apogee.regimes.map(reg => (
                <div key={reg.regime} className="p-3 rounded-xl bg-[#0A1222] border border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-semibold">{reg.regime}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#8798B3]">{reg.count.toLocaleString()}</span>
                      <span className="text-[#39D5F2] font-bold">({reg.percent}%)</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[#8798B3]">
                    ALTITUDE CRITERIA: <span className="text-white">{reg.range}</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#39D5F2] h-full rounded-full" style={{ width: `${reg.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inclination Clusters (6 cols) */}
          <div className="lg:col-span-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                ORBITAL INCLINATION CORRIDORS ({analytics.orbitalTrajectory.inclination.validCount.toLocaleString()} MEASURED)
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">inclination_deg</span>
            </div>

            <div className="space-y-2">
              {analytics.orbitalTrajectory.inclination.clusters.map(cluster => (
                <div key={cluster.name} className="p-2.5 rounded-xl bg-[#0A1222] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-semibold">{cluster.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">{cluster.band}</span>
                      <span className="text-[#10B981] font-bold">{cluster.count} ({cluster.percent}%)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#8798B3] leading-relaxed">
                    {cluster.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Apogee vs Perigee Eccentricity Scatter Plot (Paired Measurements) */}
        {analytics.orbitalTrajectory.scatterSample.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[#A78BFA]" />
                APOGEE VS PERIGEE ORBITAL ECCENTRICITY SCATTER (REPRESENTATIVE MISSIONS)
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">
                CIRCULAR LEO VS ELLIPTICAL TRANSFER
              </span>
            </div>

            {/* Scatter Plot SVG Container */}
            <div className="relative p-4 rounded-xl bg-[#0A1222] border border-white/5 overflow-hidden">
              <div className="h-44 w-full relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 160">
                  {/* Grid Lines */}
                  <line x1="50" y1="130" x2="780" y2="130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <line x1="50" y1="80" x2="780" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                  <line x1="50" y1="30" x2="780" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
                  <line x1="50" y1="20" x2="50" y2="130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                  {/* Y Axis labels (Apogee km) */}
                  <text x="45" y="133" fill="#8798B3" fontSize="9" textAnchor="end" fontFamily="monospace">0 km</text>
                  <text x="45" y="83" fill="#8798B3" fontSize="9" textAnchor="end" fontFamily="monospace">20k km</text>
                  <text x="45" y="33" fill="#8798B3" fontSize="9" textAnchor="end" fontFamily="monospace">40k+ km</text>

                  {/* X Axis labels (Perigee km) */}
                  <text x="50" y="148" fill="#8798B3" fontSize="9" textAnchor="middle" fontFamily="monospace">0 km</text>
                  <text x="232" y="148" fill="#8798B3" fontSize="9" textAnchor="middle" fontFamily="monospace">250 km</text>
                  <text x="415" y="148" fill="#8798B3" fontSize="9" textAnchor="middle" fontFamily="monospace">500 km</text>
                  <text x="597" y="148" fill="#8798B3" fontSize="9" textAnchor="middle" fontFamily="monospace">750 km</text>
                  <text x="780" y="148" fill="#8798B3" fontSize="9" textAnchor="middle" fontFamily="monospace">1000 km</text>

                  {/* Scatter Points */}
                  {analytics.orbitalTrajectory.scatterSample.map((pt, idx) => {
                    // Map perigee (0 to 1000 km) to X (50 to 780)
                    const clampedPerigee = Math.min(Math.max(pt.perigeeKm, 0), 1000);
                    const cx = 50 + (clampedPerigee / 1000) * 730;

                    // Map apogee (0 to 40000 km) to Y (130 to 25) with log scale for readability
                    const apogeeClamped = Math.min(Math.max(pt.apogeeKm, 0), 45000);
                    const cy = 130 - (Math.sqrt(apogeeClamped) / Math.sqrt(45000)) * 105;

                    return (
                      <circle
                        key={idx}
                        cx={cx}
                        cy={cy}
                        r={pt.launchClass === 'Deep space' ? 4.5 : 3}
                        fill={pt.launchClass === 'Deep space' ? '#F59E0B' : pt.outcome === 'Success' ? '#39D5F2' : '#F43F5E'}
                        opacity={0.8}
                        className="cursor-pointer hover:r-5 hover:opacity-100 transition-all"
                        onMouseEnter={() => setHoveredScatterPoint(pt)}
                        onMouseLeave={() => setHoveredScatterPoint(null)}
                      />
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredScatterPoint && (
                  <div className="absolute top-2 right-4 bg-[#070D1A]/95 border border-[#39D5F2]/40 p-2 rounded-lg text-xs font-mono text-white shadow-xl pointer-events-none z-10 space-y-0.5">
                    <div className="font-bold text-[#39D5F2]">{hoveredScatterPoint.mission}</div>
                    <div className="text-[11px] text-[#8798B3]">Vehicle: {hoveredScatterPoint.vehicle} ({hoveredScatterPoint.year})</div>
                    <div className="text-[11px]">
                      Apogee: <strong className="text-white">{hoveredScatterPoint.apogeeKm.toLocaleString()} km</strong> | Perigee: <strong className="text-white">{hoveredScatterPoint.perigeeKm.toLocaleString()} km</strong>
                    </div>
                    {hoveredScatterPoint.inclinationDeg !== null && (
                      <div className="text-[11px] text-[#A78BFA]">Inclination: {hoveredScatterPoint.inclinationDeg}°</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Mission Classification: Orbital vs Deep Space (Step 5) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#39D5F2]" />
              MISSION CLASSIFICATION // ORBITAL VS DEEP SPACE (launch_class)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Actual dataset mission classes. Earth orbital insertions compared against escape-velocity planetary and lunar missions.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8798B3]">2 CANONICAL CLASSES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Orbital Class Card */}
          <div className="p-4 rounded-xl bg-[#0A1222] border border-[#39D5F2]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-white block">ORBITAL MISSIONS</span>
                <span className="text-[10px] font-mono text-[#8798B3]">Earth bound orbits (LEO, SSO, MEO, GEO, GTO)</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#39D5F2]/10 text-[#39D5F2] border border-[#39D5F2]/30">
                {analytics.missionClass.orbital.percent}% SHARE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">TOTAL</span>
                <span className="text-sm font-bold text-white">{analytics.missionClass.orbital.count.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                <span className="text-sm font-bold text-[#10B981]">{analytics.missionClass.orbital.success.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                <span className="text-sm font-bold text-[#F43F5E]">{analytics.missionClass.orbital.failure.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#8798B3]">SUCCESS RATE:</span>
                <span className="text-[#10B981] font-bold">{analytics.missionClass.orbital.successRate}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#10B981] h-full" style={{ width: `${analytics.missionClass.orbital.successRate}%` }} />
                <div className="bg-[#F43F5E] h-full" style={{ width: `${100 - analytics.missionClass.orbital.successRate}%` }} />
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#8798B3] pt-1 border-t border-white/5 flex justify-between">
              <span>Total Mass Lifted: <strong className="text-white">{analytics.missionClass.orbital.totalMassT.toLocaleString()} t</strong></span>
              <span>Avg Payload: <strong className="text-white">{analytics.missionClass.orbital.avgMassT} t</strong></span>
            </div>
          </div>

          {/* Deep Space Class Card */}
          <div className="p-4 rounded-xl bg-[#0A1222] border border-[#F59E0B]/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-white block">DEEP SPACE MISSIONS</span>
                <span className="text-[10px] font-mono text-[#8798B3]">Lunar, Mars, Venus, Solar & Interplanetary Trajectories</span>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                {analytics.missionClass.deepSpace.percent}% SHARE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">TOTAL</span>
                <span className="text-sm font-bold text-white">{analytics.missionClass.deepSpace.count.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                <span className="text-sm font-bold text-[#10B981]">{analytics.missionClass.deepSpace.success.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#101B2D]">
                <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                <span className="text-sm font-bold text-[#F43F5E]">{analytics.missionClass.deepSpace.failure.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#8798B3]">SUCCESS RATE:</span>
                <span className="text-[#10B981] font-bold">{analytics.missionClass.deepSpace.successRate}%</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-[#10B981] h-full" style={{ width: `${analytics.missionClass.deepSpace.successRate}%` }} />
                <div className="bg-[#F43F5E] h-full" style={{ width: `${100 - analytics.missionClass.deepSpace.successRate}%` }} />
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#8798B3] pt-1 border-t border-white/5 flex justify-between">
              <span>Total Mass Lifted: <strong className="text-white">{analytics.missionClass.deepSpace.totalMassT.toLocaleString()} t</strong></span>
              <span>Avg Payload: <strong className="text-white">{analytics.missionClass.deepSpace.avgMassT} t</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Launch Vehicle Analytics & Reliability Benchmark (Step 4) */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Rocket className="w-4 h-4 text-[#A78BFA]" />
              LAUNCH VEHICLE RELIABILITY & TONNAGE LEADERBOARD (TOP 25 FLEETS)
            </h3>
            <p className="text-[11px] text-[#8798B3]">
              Ranked by total historical launches, success rate, average mass capability, and operating sovereign state.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#8798B3]">CLICK ROW TO INSPECT VEHICLE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Vehicle Series</th>
                <th className="pb-2">Sovereign State</th>
                <th className="pb-2">Operating Agency</th>
                <th className="pb-2">Total Flights</th>
                <th className="pb-2">Success</th>
                <th className="pb-2">Failures</th>
                <th className="pb-2">Success Rate</th>
                <th className="pb-2">Avg Payload</th>
                <th className="pb-2 text-right">Service Era</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {analytics.topVehicles.map((v) => {
                const isInspected = inspectedVehicle === v.vehicle;

                return (
                  <tr 
                    key={v.vehicle}
                    onClick={() => setInspectedVehicle(isInspected ? null : v.vehicle)}
                    className={`transition cursor-pointer ${
                      isInspected ? 'bg-[#101B2D] border-l-2 border-[#39D5F2]' : 'hover:bg-[#14233D]'
                    }`}
                  >
                    <td className="py-2.5 font-sans font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span>{v.vehicle}</span>
                        {v.isSmallSample && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-mono" title="Small sample size (<10 launches)">
                            LOW SAMPLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 text-[#8798B3]">{v.primaryCountry}</td>
                    <td className="py-2.5 text-[#EAF3FF]">{v.primaryAgency}</td>
                    <td className="py-2.5 text-white font-bold">{v.total.toLocaleString()}</td>
                    <td className="py-2.5 text-[#10B981] font-semibold">{v.success.toLocaleString()}</td>
                    <td className="py-2.5 text-[#F43F5E] font-semibold">{v.failure.toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className="text-[#10B981] font-bold">{v.successRate}%</span>
                    </td>
                    <td className="py-2.5 text-[#39D5F2]">
                      {v.avgMassT > 0 ? `${v.avgMassT} t` : 'N/A'}
                    </td>
                    <td className="py-2.5 text-right text-[#8798B3]">
                      {v.firstYear}–{v.latestYear}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Vehicle Roster Inspector */}
        {inspectedVehicle && inspectedVehicleMissions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-[#0A1222] border border-[#39D5F2]/30 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-[#39D5F2]" />
                RECORDED MISSIONS // {inspectedVehicle} (SHOWING LATEST {inspectedVehicleMissions.length})
              </span>
              <button 
                onClick={() => setInspectedVehicle(null)}
                className="text-[10px] font-mono text-[#8798B3] hover:text-white"
              >
                Close Inspector
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-[#8798B3] uppercase">
                    <th className="pb-1.5">Date / Tag</th>
                    <th className="pb-1.5">Mission Payload</th>
                    <th className="pb-1.5">Agency</th>
                    <th className="pb-1.5">Spaceport</th>
                    <th className="pb-1.5">Payload Mass</th>
                    <th className="pb-1.5 text-right">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inspectedVehicleMissions.map(m => (
                    <tr 
                      key={m.launch_tag}
                      onClick={() => setSelectedMission(m)}
                      className="hover:bg-[#14233D] transition cursor-pointer"
                    >
                      <td className="py-2 text-white">{m.date || m.year}</td>
                      <td className="py-2 text-white font-semibold">{m.mission || m.flight || m.launch_vehicle}</td>
                      <td className="py-2 text-[#8798B3]">{m.agency || 'N/A'}</td>
                      <td className="py-2 text-[#8798B3]">{m.launch_site}</td>
                      <td className="py-2 text-[#39D5F2]">{m.payload_mass_t !== null ? `${m.payload_mass_t} t` : 'N/A'}</td>
                      <td className="py-2 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.outcome === 'Success' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F43F5E]/15 text-[#F43F5E]'
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
        )}
      </div>

      {/* Detail Modal for Clicked Missions */}
      {selectedMission && (
        <MissionDetailModal 
          mission={selectedMission} 
          onClose={() => setSelectedMission(null)} 
        />
      )}
    </div>
  );
};

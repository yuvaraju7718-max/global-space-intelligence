import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe2, 
  MapPin, 
  Navigation, 
  Layers, 
  Compass, 
  Crosshair, 
  TrendingUp, 
  Calendar, 
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  Rocket,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { InteractiveGlobe } from '../../components/Globe/InteractiveGlobe';
import { MissionDetailModal } from '../../components/Cards/MissionDetailModal';
import { 
  loadCleanedSpaceMissions,
  calculateLaunchSiteStats,
  calculateCountryStats,
  getMissionsForSite
} from '../../services/dataService';
import { 
  FilterState, 
  CleanedMissionRecord, 
  LaunchSiteFreqStat, 
  CountryAggStat 
} from '../../types';

interface GlobalExplorerPageProps {
  filters: FilterState;
}

export const GlobalExplorerPage: React.FC<GlobalExplorerPageProps> = ({ filters }) => {
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [selectedSiteName, setSelectedSiteName] = useState<string>('Plesetsk');
  const [siteSearch, setSiteSearch] = useState<string>('');
  const [hoveredSite, setHoveredSite] = useState<LaunchSiteFreqStat | null>(null);
  const [selectedMission, setSelectedMission] = useState<CleanedMissionRecord | null>(null);

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

  // 2. Filter missions by active global header filters if applicable
  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      if (m.year < filters.yearRange[0] || m.year > filters.yearRange[1]) return false;
      if (filters.selectedCountry !== 'All' && m.launch_country !== filters.selectedCountry && m.site_country !== filters.selectedCountry) return false;
      if (filters.selectedType !== 'All' && m.launch_class !== filters.selectedType) return false;
      if (filters.selectedStatus !== 'All' && m.outcome !== filters.selectedStatus) return false;
      return true;
    });
  }, [missions, filters]);

  // 3. Compute real launch site and country statistics from the dataset
  const launchSiteStats = useMemo(() => calculateLaunchSiteStats(filteredMissions), [filteredMissions]);
  const countryStats = useMemo(() => calculateCountryStats(filteredMissions), [filteredMissions]);

  // Verified sites that have genuine coordinates for plotting
  const verifiedSites = useMemo(() => {
    return launchSiteStats.filter(s => s.verified && s.coordinates !== null);
  }, [launchSiteStats]);

  // Selected site object
  const selectedSite = useMemo(() => {
    if (launchSiteStats.length === 0) return null;
    const match = launchSiteStats.find(s => s.siteName.toLowerCase() === selectedSiteName.toLowerCase());
    return match || launchSiteStats[0];
  }, [launchSiteStats, selectedSiteName]);

  // Country statistics corresponding to the selected site
  const selectedCountryStat = useMemo(() => {
    if (!selectedSite) return null;
    return countryStats.find(c => 
      c.country.toLowerCase() === selectedSite.country.toLowerCase() ||
      selectedSite.country.toLowerCase().includes(c.country.toLowerCase())
    ) || null;
  }, [selectedSite, countryStats]);

  // Missions originating specifically from this launch complex
  const recentSiteMissions = useMemo(() => {
    if (!selectedSite) return [];
    return getMissionsForSite(filteredMissions, selectedSite.siteName, 5);
  }, [filteredMissions, selectedSite]);

  // Filtered list of launch sites for quick targeting buttons / directory
  const filteredSiteList = useMemo(() => {
    if (!siteSearch.trim()) return launchSiteStats;
    const q = siteSearch.toLowerCase().trim();
    return launchSiteStats.filter(s => 
      s.siteName.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q)
    );
  }, [launchSiteStats, siteSearch]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 font-mono text-xs">
        <Loader2 className="w-8 h-8 text-[#39D5F2] animate-spin" />
        <div className="text-white font-semibold tracking-wider">
          SYNCHRONIZING GEODETIC SPACEPORT ATLAS...
        </div>
        <div className="text-[#8798B3] text-[11px]">
          Computing real launch complex coordinates and telemetry from 7,430 missions
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-[#0A1222] border border-[#F43F5E]/40 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[#F43F5E] font-bold">
          <AlertCircle className="w-5 h-5" />
          <span>GEODETIC MAPPING ERROR</span>
        </div>
        <p className="text-[#8798B3]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-white hover:bg-[#F43F5E]/25 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RELOAD SPACE MISSIONS</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner with Real Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#39D5F2] animate-pulse" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              GEODETIC MAPPING // GLOBAL EXPLORER
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            GLOBAL LAUNCH SITES & SOVEREIGN SPACEPORT ATLAS
          </h2>
          <p className="text-xs text-[#8798B3]">
            Verified geodetic coordinates, sovereign facility telemetry, and historical mission cadence.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-[#0A1222] border border-white/10">
            <span className="text-[#8798B3] block text-[10px]">MONITORED SITES</span>
            <span className="text-[#39D5F2] font-bold text-sm">
              {launchSiteStats.length} SITES ({verifiedSites.length} VERIFIED)
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#0A1222] border border-white/10">
            <span className="text-[#8798B3] block text-[10px]">TOTAL RECORDED</span>
            <span className="text-[#10B981] font-bold text-sm">
              {filteredMissions.length.toLocaleString()} LAUNCHES
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Visualization + Launch Complex Telemetry Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 3D Globe / 2D Geodetic Map View (8 cols) */}
        <div className="lg:col-span-8 space-panel p-5 rounded-2xl flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#39D5F2]" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {viewMode === '3d' ? '3D ORBITAL GLOBE PROJECTION' : 'EQUIRECTANGULAR GEODETIC MAP'}
              </h3>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0A1222] border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === '3d'
                    ? 'bg-[#39D5F2]/20 border border-[#39D5F2]/40 text-[#39D5F2] font-semibold'
                    : 'text-[#8798B3] hover:text-white'
                }`}
              >
                3D GLOBE
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-3 py-1 rounded-lg transition ${
                  viewMode === '2d'
                    ? 'bg-[#39D5F2]/20 border border-[#39D5F2]/40 text-[#39D5F2] font-semibold'
                    : 'text-[#8798B3] hover:text-white'
                }`}
              >
                2D MAP
              </button>
            </div>
          </div>

          {/* Visualization Container */}
          <div className="flex-1 min-h-[460px] w-full relative">
            {viewMode === '3d' ? (
              /* Interactive 3D Globe View with Verified Real Launch Sites */
              <InteractiveGlobe 
                launchSites={verifiedSites}
                selectedSiteId={selectedSite?.siteName}
                onSelectSite={(site) => {
                  if (site) {
                    setSelectedSiteName(site.siteName || site.name);
                  }
                }}
              />
            ) : (
              /* High-Tech Vector 2D World Map Container */
              <div className="relative w-full aspect-[16/9] min-h-[440px] bg-[#070D1A] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center p-4">
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-grid-lines opacity-25 pointer-events-none" />

                {/* Reference Coordinate Lines */}
                <div className="absolute top-[50%] left-0 right-0 h-px bg-[#39D5F2]/25 border-dashed" title="Equator (0°)" />
                <div className="absolute top-[25%] left-0 right-0 h-px bg-white/5" title="Tropic of Cancer (+23.5°)" />
                <div className="absolute top-[75%] left-0 right-0 h-px bg-white/5" title="Tropic of Capricorn (-23.5°)" />
                <div className="absolute top-0 bottom-0 left-[50%] w-px bg-[#648CFF]/20" title="Prime Meridian (0°)" />

                {/* Corner Coordinates */}
                <span className="absolute top-2 left-2 text-[9px] font-mono text-[#8798B3]/60">N 90°00' // W 180°00'</span>
                <span className="absolute bottom-2 right-2 text-[9px] font-mono text-[#8798B3]/60">S 90°00' // E 180°00'</span>
                <span className="absolute top-2 right-2 text-[9px] font-mono text-[#39D5F2]/60">EQUATORIAL ASSIST BOOST: +465 m/s</span>

                {/* Stylized Vector World Map SVG */}
                <svg viewBox="-180 -90 360 180" className="w-full h-full select-none">
                  <defs>
                    <radialGradient id="sitePulseReal" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#39D5F2" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#39D5F2" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Continent Polygons */}
                  <g fill="#101F38" stroke="#1D3557" strokeWidth="0.6">
                    {/* North America */}
                    <path d="M -168 68 L -130 72 L -80 72 L -60 50 L -75 35 L -80 25 L -100 18 L -120 32 L -135 58 Z" />
                    {/* Central & South America */}
                    <path d="M -80 10 L -60 12 L -35 -5 L -40 -22 L -65 -54 L -75 -48 L -72 -20 L -80 0 Z" />
                    {/* Europe */}
                    <path d="M -10 36 L 2 52 L 20 62 L 40 55 L 25 38 L 5 36 Z" />
                    {/* Africa */}
                    <path d="M -15 32 L 32 30 L 48 10 L 40 -15 L 20 -34 L 12 -20 L -2 5 Z" />
                    {/* Eurasia / Russia / China */}
                    <path d="M 30 70 L 100 75 L 170 65 L 140 38 L 115 22 L 75 25 L 55 40 Z" />
                    {/* India */}
                    <path d="M 70 25 L 88 22 L 80 12 L 76 8 L 72 18 Z" />
                    {/* Japan */}
                    <path d="M 130 32 L 142 44 L 140 36 Z" />
                    {/* Australia */}
                    <path d="M 115 -15 L 150 -12 L 152 -34 L 138 -38 L 115 -28 Z" />
                  </g>

                  {/* Render Verified Sites only */}
                  {verifiedSites.map((site) => {
                    const coords = site.coordinates!;
                    const lng = coords[1];
                    const lat = -coords[0]; // invert Y for SVG
                    const isSelected = selectedSite?.siteName === site.siteName;
                    const isHovered = hoveredSite?.siteName === site.siteName;

                    return (
                      <g 
                        key={site.siteName} 
                        className="cursor-pointer group"
                        onClick={() => setSelectedSiteName(site.siteName)}
                        onMouseEnter={() => setHoveredSite(site)}
                        onMouseLeave={() => setHoveredSite(null)}
                      >
                        {/* Pulsing Beacon if selected */}
                        {isSelected && (
                          <circle cx={lng} cy={lat} r="7" fill="url(#sitePulseReal)" className="animate-ping" />
                        )}

                        {/* Outer Pin */}
                        <circle
                          cx={lng}
                          cy={lat}
                          r={isSelected ? 4.5 : isHovered ? 3.5 : 2.5}
                          fill={isSelected ? '#39D5F2' : isHovered ? '#A78BFA' : '#648CFF'}
                          stroke="#FFFFFF"
                          strokeWidth="0.6"
                          className="transition-all duration-200"
                        />

                        {/* Hover Tooltip inside SVG */}
                        {(isSelected || isHovered) && (
                          <g>
                            <rect
                              x={lng > 60 ? lng - 75 : lng + 4}
                              y={lat - 16}
                              width="72"
                              height="14"
                              rx="2"
                              fill="#0A1222"
                              stroke={isSelected ? '#39D5F2' : '#648CFF'}
                              strokeWidth="0.5"
                            />
                            <text
                              x={lng > 60 ? lng - 39 : lng + 40}
                              y={lat - 6}
                              fill="#FFFFFF"
                              fontSize="4"
                              fontFamily="Space Grotesk, sans-serif"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {site.siteName} ({site.totalLaunches.toLocaleString()})
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Bottom map status */}
                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-[#8798B3] bg-[#0A1222]/80 px-2 py-0.5 rounded border border-white/5">
                  CLICK TO TARGET LAUNCH COMPLEX // WGS84
                </div>
              </div>
            )}
          </div>

          {/* Quick Select Buttons & Launch Complex Directory */}
          <div className="pt-2 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider">
                SPACEPORT DIRECTORY (RANKED BY ACTUAL LAUNCH VOLUME):
              </span>
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-[#8798B3] absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={siteSearch}
                  onChange={(e) => setSiteSearch(e.target.value)}
                  placeholder="Filter launch complexes..."
                  className="w-full bg-[#0A1222] border border-white/10 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-[#8798B3] focus:outline-none focus:border-[#39D5F2]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
              {filteredSiteList.slice(0, 18).map(site => {
                const isSelected = selectedSite?.siteName === site.siteName;
                return (
                  <button
                    key={site.siteName}
                    onClick={() => setSelectedSiteName(site.siteName)}
                    className={`p-2 rounded-xl text-left border transition text-xs font-mono truncate ${
                      isSelected
                        ? 'bg-[#39D5F2]/15 border-[#39D5F2] text-white shadow-sm'
                        : 'bg-[#0A1222]/80 border-white/5 hover:border-white/20 text-[#8798B3] hover:text-white'
                    }`}
                    title={`${site.siteName} (${site.country}) - ${site.totalLaunches.toLocaleString()} launches, ${site.successRate}% SR`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold truncate text-[#EAF3FF]">{site.siteName}</span>
                      {site.verified ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#39D5F2]" title="Coordinates Verified" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" title="Offshore/Mobile Unmapped" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#39D5F2] font-semibold mt-0.5">
                      {site.totalLaunches.toLocaleString()} <span className="text-[#8798B3] font-normal">({site.successRate}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Launch Complex Detailed Dossier (4 cols) */}
        <div className="lg:col-span-4 space-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#39D5F2]" />
                LAUNCH COMPLEX DOSSIER
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                selectedSite?.verified 
                  ? 'bg-[#39D5F2]/15 text-[#39D5F2] border-[#39D5F2]/30' 
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
              }`}>
                {selectedSite?.verified ? 'VERIFIED SPACEPORT' : 'OFFSHORE / MOBILE'}
              </span>
            </div>

            {selectedSite ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-display font-bold text-white">
                    {selectedSite.siteName}
                  </h3>
                  <p className="text-xs font-mono text-[#39D5F2]">
                    Location: {selectedSite.country}
                  </p>
                </div>

                {/* Verified Statistics Grid from Actual Dataset */}
                <div className="grid grid-cols-2 gap-2.5 font-mono">
                  <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">TOTAL LAUNCHES</span>
                    <span className="text-base font-bold text-white">
                      {selectedSite.totalLaunches.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">SUCCESS RATE</span>
                    <span className="text-base font-bold text-[#10B981]">
                      {selectedSite.successRate}%
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">SUCCESSFUL</span>
                    <span className="text-base font-bold text-[#10B981]">
                      {selectedSite.successful.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                    <span className="text-[10px] text-[#8798B3] block">FAILURES</span>
                    <span className="text-base font-bold text-[#F43F5E]">
                      {selectedSite.failed.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Coordinates & Provenance */}
                <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5 space-y-1 font-mono text-xs">
                  <span className="text-[10px] text-[#8798B3] block uppercase tracking-wider">GEODETIC COORDINATES</span>
                  {selectedSite.coordinates ? (
                    <div className="text-[#39D5F2] font-semibold">
                      {selectedSite.coordinates[0].toFixed(4)}° N, {selectedSite.coordinates[1].toFixed(4)}° E
                    </div>
                  ) : (
                    <div className="text-[#F59E0B] text-[11px]">
                      Offshore / Mobile Sea Launch Platform (Unmapped Coordinates)
                    </div>
                  )}
                  {selectedSite.firstLaunchDate && (
                    <div className="text-[10px] text-[#8798B3] pt-1 border-t border-white/5">
                      Operational Span: {selectedSite.firstLaunchDate} to {selectedSite.latestLaunchDate}
                    </div>
                  )}
                </div>

                {/* Primary Launch Vehicles */}
                {selectedSite.primaryVehicles && selectedSite.primaryVehicles.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-[#8798B3] block mb-1.5 uppercase tracking-wider">
                      PRIMARY ROCKET VEHICLES
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSite.primaryVehicles.map(veh => (
                        <span key={veh} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-white">
                          {veh}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notable Launch Pads from Dataset */}
                {selectedSite.pads && selectedSite.pads.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-[#8798B3] block mb-1.5 uppercase tracking-wider">
                      ACTIVE LAUNCH PADS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSite.pads.map(pad => (
                        <span key={pad} className="px-2 py-0.5 rounded bg-[#39D5F2]/10 border border-[#39D5F2]/20 text-[11px] font-mono text-[#39D5F2]">
                          {pad}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Verified Flights originating from this complex */}
                {recentSiteMissions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-[#8798B3] block uppercase tracking-wider">
                      RECENT RECORDED MISSIONS
                    </span>
                    <div className="space-y-1">
                      {recentSiteMissions.map((m) => (
                        <div
                          key={m.launch_tag}
                          onClick={() => setSelectedMission(m)}
                          className="p-2 rounded-lg bg-[#0A1222] border border-white/5 hover:border-[#39D5F2]/30 cursor-pointer flex items-center justify-between text-xs font-mono transition"
                        >
                          <div className="truncate pr-2">
                            <span className="text-white font-medium block truncate">
                              {m.mission || m.flight || m.launch_vehicle}
                            </span>
                            <span className="text-[10px] text-[#8798B3]">
                              {m.date} • {m.launch_vehicle}
                            </span>
                          </div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                            m.outcome === 'Success' 
                              ? 'bg-[#10B981]/15 text-[#10B981]' 
                              : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                          }`}>
                            {m.outcome}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8798B3] font-mono">
                Select a launch site to inspect its telemetry.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-[#8798B3] flex items-center justify-between">
            <span>DATUM: WGS84 GEODETIC</span>
            <span>VERIFIED SITES: {verifiedSites.length}</span>
          </div>
        </div>
      </div>

      {/* Mission Detail Modal for flight inspect */}
      <MissionDetailModal
        mission={selectedMission}
        onClose={() => setSelectedMission(null)}
      />
    </div>
  );
};

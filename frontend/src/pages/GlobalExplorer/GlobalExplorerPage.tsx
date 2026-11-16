import React, { useState } from 'react';
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
  Award
} from 'lucide-react';
import { LAUNCH_SITES, COUNTRY_STATS, SAMPLE_MISSIONS } from '../../data/spaceData';
import { LaunchSite, CountryStat, SpaceMission, FilterState } from '../../types';

interface GlobalExplorerPageProps {
  filters: FilterState;
}

export const GlobalExplorerPage: React.FC<GlobalExplorerPageProps> = ({ filters }) => {
  const [selectedSite, setSelectedSite] = useState<LaunchSite>(LAUNCH_SITES[0]);
  const [selectedCountryName, setSelectedCountryName] = useState<string>('United States');
  const [hoveredSite, setHoveredSite] = useState<LaunchSite | null>(null);

  const selectedCountryStat = COUNTRY_STATS.find(c => c.country.includes(selectedCountryName) || selectedCountryName.includes(c.country)) || COUNTRY_STATS[0];

  const missionsForSelectedSite = SAMPLE_MISSIONS.filter(m => 
    m.launchSite.toLowerCase().includes(selectedSite.name.toLowerCase().split(' ')[0])
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#39D5F2] animate-pulse" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              GEODETIC MAPPING // GEOGRAPHIC ATLAS
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            GLOBAL LAUNCH SITES & SOVEREIGN SPACEPORT ATLAS
          </h2>
          <p className="text-xs text-[#8798B3]">
            Verified coordinates, launch azimuth constraints, and orbital trajectory coverage.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-[#0A1222] border border-white/10">
            <span className="text-[#8798B3] block text-[10px]">MONITORED SITES</span>
            <span className="text-[#39D5F2] font-bold text-sm">{LAUNCH_SITES.length} GLOBAL PADS</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-[#0A1222] border border-white/10">
            <span className="text-[#8798B3] block text-[10px]">TOTAL RECORDED</span>
            <span className="text-[#10B981] font-bold text-sm">4,682 LAUNCHES</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: World Map & Spaceport Radar (8 cols) */}
        <div className="lg:col-span-8 space-panel p-5 rounded-2xl flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#39D5F2]" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                EQUIRECTANGULAR GEODETIC MAP PROJECTION
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8798B3]">
              SELECT PINS TO PINPOINT LAUNCH COMPLEX
            </span>
          </div>

          {/* High-Tech Vector World Map Container */}
          <div className="relative w-full aspect-[16/9] min-h-[360px] bg-[#070D1A] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center p-4">
            {/* Grid Coordinates Overlay */}
            <div className="absolute inset-0 bg-grid-lines opacity-25 pointer-events-none" />

            {/* Latitude and Equator reference lines */}
            <div className="absolute top-[50%] left-0 right-0 h-px bg-[#39D5F2]/25 border-dashed" title="Equator (0°)" />
            <div className="absolute top-[25%] left-0 right-0 h-px bg-white/5" title="Tropic of Cancer (+23.5°)" />
            <div className="absolute top-[75%] left-0 right-0 h-px bg-white/5" title="Tropic of Capricorn (-23.5°)" />
            <div className="absolute top-0 bottom-0 left-[50%] w-px bg-[#648CFF]/20" title="Prime Meridian (0°)" />

            {/* Corner telemetry coordinates */}
            <span className="absolute top-2 left-2 text-[9px] font-mono text-[#8798B3]/60">N 90°00' // W 180°00'</span>
            <span className="absolute bottom-2 right-2 text-[9px] font-mono text-[#8798B3]/60">S 90°00' // E 180°00'</span>
            <span className="absolute top-2 right-2 text-[9px] font-mono text-[#39D5F2]/60">EQUATORIAL ASSIST BOOST: +465 m/s</span>

            {/* Stylized World Map SVG */}
            <svg viewBox="-180 -90 360 180" className="w-full h-full select-none">
              <defs>
                <radialGradient id="sitePulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#39D5F2" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#39D5F2" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Simplified world coast outlines */}
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

              {/* Render Launch Sites on SVG with exact latitude and longitude */}
              {LAUNCH_SITES.map((site) => {
                const lng = site.coordinates[1];
                const lat = -site.coordinates[0]; // invert Y for SVG
                const isSelected = selectedSite.id === site.id;
                const isHovered = hoveredSite?.id === site.id;

                return (
                  <g 
                    key={site.id} 
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedSite(site);
                      setSelectedCountryName(site.country);
                    }}
                    onMouseEnter={() => setHoveredSite(site)}
                    onMouseLeave={() => setHoveredSite(null)}
                  >
                    {/* Pulsing beacon if selected */}
                    {isSelected && (
                      <circle cx={lng} cy={lat} r="7" fill="url(#sitePulse)" className="animate-ping" />
                    )}

                    {/* Outer ring */}
                    <circle
                      cx={lng}
                      cy={lat}
                      r={isSelected ? 4 : isHovered ? 3.5 : 2.5}
                      fill={isSelected ? '#39D5F2' : isHovered ? '#A78BFA' : '#648CFF'}
                      stroke="#FFFFFF"
                      strokeWidth="0.6"
                      className="transition-all duration-200"
                    />

                    {/* Hover tooltip inside SVG */}
                    {(isSelected || isHovered) && (
                      <g>
                        <rect
                          x={lng > 60 ? lng - 65 : lng + 4}
                          y={lat - 14}
                          width="60"
                          height="12"
                          rx="2"
                          fill="#0A1222"
                          stroke={isSelected ? '#39D5F2' : '#648CFF'}
                          strokeWidth="0.5"
                        />
                        <text
                          x={lng > 60 ? lng - 35 : lng + 34}
                          y={lat - 5}
                          fill="#FFFFFF"
                          fontSize="4"
                          fontFamily="Space Grotesk, sans-serif"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {site.name.split(' ')[0]}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Select Buttons for Major Launch Sites */}
          <div className="pt-2">
            <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block mb-2">
              QUICK TARGETING:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LAUNCH_SITES.slice(0, 8).map(site => (
                <button
                  key={site.id}
                  onClick={() => {
                    setSelectedSite(site);
                    setSelectedCountryName(site.country);
                  }}
                  className={`p-2 rounded-xl text-left border transition text-xs font-mono truncate ${
                    selectedSite.id === site.id
                      ? 'bg-[#39D5F2]/15 border-[#39D5F2] text-white shadow-sm'
                      : 'bg-[#0A1222]/80 border-white/5 hover:border-white/20 text-[#8798B3] hover:text-white'
                  }`}
                >
                  <div className="font-semibold truncate text-[#EAF3FF]">{site.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-[#8798B3] truncate">{site.country}</div>
                </button>
              ))}
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#39D5F2]/15 text-[#39D5F2] border border-[#39D5F2]/30">
                ACTIVE SPACEPORT
              </span>
            </div>

            <div>
              <h3 className="text-lg font-display font-bold text-white">
                {selectedSite.name}
              </h3>
              <p className="text-xs font-mono text-[#39D5F2]">
                {selectedSite.country}
              </p>
            </div>

            <p className="text-xs text-[#8798B3] leading-relaxed">
              {selectedSite.description}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">OPERATIONAL SINCE</span>
                <span className="text-sm font-bold text-white">{selectedSite.operationalSince}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">SUCCESS RATE</span>
                <span className="text-sm font-bold text-[#10B981]">{selectedSite.successRate}%</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">HISTORIC LAUNCHES</span>
                <span className="text-sm font-bold text-white">{selectedSite.totalLaunches.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5">
                <span className="text-[10px] text-[#8798B3] block">OPERATOR ENTITIES</span>
                <span className="text-sm font-bold text-[#648CFF]">{selectedSite.primaryOperators.length} Agencies</span>
              </div>
            </div>

            {/* Coordinates & Pads */}
            <div className="p-3 rounded-xl bg-[#0A1222] border border-white/5 space-y-1 font-mono text-xs">
              <span className="text-[10px] text-[#8798B3] block">LATITUDE & LONGITUDE</span>
              <span className="text-[#39D5F2] font-semibold">
                {selectedSite.coordinates[0].toFixed(4)}° N, {selectedSite.coordinates[1].toFixed(4)}° E
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-[#8798B3] block mb-1.5 uppercase">
                ACTIVE LAUNCH PADS / RUNWAYS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSite.notablePads.map(pad => (
                  <span key={pad} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-white">
                    {pad}
                  </span>
                ))}
              </div>
            </div>

            {/* Associated Country Summary */}
            <div className="p-3.5 rounded-xl bg-[#0A1222] border border-[#39D5F2]/20 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8798B3]">SOVEREIGN STATE:</span>
                <span className="text-[#39D5F2] font-bold">{selectedCountryStat.country}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8798B3]">GLOBAL SHARE:</span>
                <span className="text-white font-bold">{selectedCountryStat.shareOfGlobal}%</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-mono text-[#8798B3] block text-center">
              TELEMETRY CODES // WGS84 DATUM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

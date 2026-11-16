import React, { useState, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Bell, 
  RotateCcw, 
  Clock, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { FilterState } from '../../types';
import { COUNTRY_STATS } from '../../data/spaceData';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle: string;
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onOpenSearch: () => void;
  isSidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  pageSubtitle,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenSearch,
  isSidebarCollapsed,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasActiveFilters = 
    filters.searchQuery !== '' || 
    filters.selectedCountry !== 'All' || 
    filters.selectedType !== 'All' || 
    filters.yearRange[0] !== 1957 || 
    filters.yearRange[1] !== 2026;

  const missionTypes = [
    'All',
    'Communications',
    'Earth Observation',
    'Human Spaceflight',
    'Planetary & Deep Space',
    'Lunar Exploration',
    'Navigation & Positioning',
    'Technology Demonstration',
    'Defense & Reconnaissance'
  ];

  return (
    <header 
      className={`fixed top-0 right-0 z-30 h-20 bg-[#0A1222]/90 backdrop-blur-xl border-b border-[#39D5F2]/15 px-6 flex items-center justify-between transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'left-20' : 'left-72'
      }`}
    >
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest text-[#39D5F2] uppercase font-semibold">
            GSI // TELEMETRY
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[10px] font-mono text-[#8798B3] uppercase">
            {pageTitle}
          </span>
        </div>
        <h1 className="text-lg font-display font-bold text-white tracking-wide flex items-center gap-2">
          {pageTitle}
          <span className="hidden md:inline-block text-xs font-normal text-[#8798B3] font-sans">
            — {pageSubtitle}
          </span>
        </h1>
      </div>

      {/* Global Controls & Filters */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#101B2D] hover:bg-[#14233D] border border-white/10 hover:border-[#39D5F2]/40 text-[#8798B3] hover:text-white transition shadow-sm"
        >
          <Search className="w-4 h-4 text-[#39D5F2]" />
          <span className="text-xs font-medium hidden sm:inline">Search missions, launch sites...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-[#8798B3]">
            Ctrl K
          </kbd>
        </button>

        {/* Year Range Picker */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#101B2D] border border-white/10 text-xs font-mono">
          <span className="text-[#8798B3] text-[11px]">YEARS:</span>
          <input
            type="number"
            min="1957"
            max={filters.yearRange[1]}
            value={filters.yearRange[0]}
            onChange={(e) => onFilterChange({ yearRange: [parseInt(e.target.value) || 1957, filters.yearRange[1]] })}
            className="w-14 bg-[#0A1222] border border-white/10 rounded px-1.5 py-0.5 text-[#39D5F2] text-center focus:outline-none focus:border-[#39D5F2]"
          />
          <span className="text-[#8798B3]">–</span>
          <input
            type="number"
            min={filters.yearRange[0]}
            max="2026"
            value={filters.yearRange[1]}
            onChange={(e) => onFilterChange({ yearRange: [filters.yearRange[0], parseInt(e.target.value) || 2026] })}
            className="w-14 bg-[#0A1222] border border-white/10 rounded px-1.5 py-0.5 text-[#39D5F2] text-center focus:outline-none focus:border-[#39D5F2]"
          />
        </div>

        {/* Country Filter Dropdown */}
        <div className="hidden lg:flex items-center relative">
          <select
            value={filters.selectedCountry}
            onChange={(e) => onFilterChange({ selectedCountry: e.target.value })}
            className="appearance-none bg-[#101B2D] hover:bg-[#14233D] border border-white/10 hover:border-[#39D5F2]/40 rounded-xl px-3 py-2 pr-8 text-xs text-[#EAF3FF] font-medium focus:outline-none focus:border-[#39D5F2] cursor-pointer transition"
          >
            <option value="All">All Nations</option>
            {COUNTRY_STATS.map(c => (
              <option key={c.code} value={c.country}>{c.country}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8798B3] absolute right-2.5 pointer-events-none" />
        </div>

        {/* Mission Type Filter Dropdown */}
        <div className="hidden md:flex items-center relative">
          <select
            value={filters.selectedType}
            onChange={(e) => onFilterChange({ selectedType: e.target.value })}
            className="appearance-none bg-[#101B2D] hover:bg-[#14233D] border border-white/10 hover:border-[#39D5F2]/40 rounded-xl px-3 py-2 pr-8 text-xs text-[#EAF3FF] font-medium focus:outline-none focus:border-[#39D5F2] cursor-pointer transition"
          >
            {missionTypes.map(t => (
              <option key={t} value={t}>{t === 'All' ? 'All Mission Types' : t}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8798B3] absolute right-2.5 pointer-events-none" />
        </div>

        {/* Reset Filter Button if active */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#39D5F2]/10 border border-[#39D5F2]/30 text-[#39D5F2] hover:bg-[#39D5F2]/20 text-xs font-mono transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        )}

        {/* Real-time UTC Mission Clock */}
        <div className="hidden 2xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101B2D] border border-white/10 font-mono text-[11px] text-[#8798B3]">
          <Clock className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[#EAF3FF] font-semibold">{utcTime || 'SYNCING UTC...'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-10 h-10 rounded-xl bg-[#101B2D] hover:bg-[#14233D] border border-white/10 hover:border-[#39D5F2]/40 text-[#8798B3] hover:text-white flex items-center justify-center transition relative"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#39D5F2] shadow-[0_0_6px_#39D5F2]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0A1222] border border-[#39D5F2]/25 shadow-2xl p-4 space-y-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                  MISSION SYSTEM LOGS
                </span>
                <span className="text-[10px] font-mono text-[#39D5F2]">3 ACTIVE</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#101B2D] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Frontend UI Deployed</span>
                    <span className="text-[10px] font-mono text-[#10B981]">ONLINE</span>
                  </div>
                  <p className="text-[11px] text-[#8798B3]">
                    High-performance space intelligence interface compiled and active.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#101B2D] border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Dataset Ingestion Gate</span>
                    <span className="text-[10px] font-mono text-[#F59E0B]">STANDBY</span>
                  </div>
                  <p className="text-[11px] text-[#8798B3]">
                    Awaiting user confirmation to load raw space mission dataset for ML pipeline.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

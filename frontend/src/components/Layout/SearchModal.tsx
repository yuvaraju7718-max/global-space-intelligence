import React, { useState, useEffect } from 'react';
import { Search, X, Rocket, Globe2, Building2, Calendar, ArrowRight } from 'lucide-react';
import { SAMPLE_MISSIONS, LAUNCH_SITES, SPACE_AGENCIES } from '../../data/spaceData';
import { SpaceMission, LaunchSite, SpaceAgency } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (mission: SpaceMission) => void;
  onSelectSite: (site: LaunchSite) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMission,
  onSelectSite,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // handled in parent or toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.toLowerCase().trim();

  const filteredMissions = cleanQuery === '' 
    ? SAMPLE_MISSIONS.slice(0, 4) 
    : SAMPLE_MISSIONS.filter(m => 
        m.name.toLowerCase().includes(cleanQuery) ||
        m.agency.toLowerCase().includes(cleanQuery) ||
        m.vehicle.toLowerCase().includes(cleanQuery) ||
        m.country.toLowerCase().includes(cleanQuery) ||
        m.payloadType.toLowerCase().includes(cleanQuery)
      ).slice(0, 6);

  const filteredSites = cleanQuery === ''
    ? LAUNCH_SITES.slice(0, 3)
    : LAUNCH_SITES.filter(s =>
        s.name.toLowerCase().includes(cleanQuery) ||
        s.country.toLowerCase().includes(cleanQuery) ||
        s.primaryOperators.some(op => op.toLowerCase().includes(cleanQuery))
      ).slice(0, 4);

  const filteredAgencies = cleanQuery === ''
    ? SPACE_AGENCIES.slice(0, 3)
    : SPACE_AGENCIES.filter(a =>
        a.name.toLowerCase().includes(cleanQuery) ||
        a.acronym.toLowerCase().includes(cleanQuery) ||
        a.country.toLowerCase().includes(cleanQuery)
      ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0A1222] border border-[#39D5F2]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-[#101B2D]">
          <Search className="w-5 h-5 text-[#39D5F2]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search missions (e.g. Apollo, Chandrayaan, Starship), spaceports, agencies..."
            className="flex-1 bg-transparent border-none text-sm text-[#EAF3FF] placeholder-[#8798B3] focus:outline-none font-sans"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-[#8798B3] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono bg-white/5 border border-white/10 rounded text-[#8798B3] hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Missions Category */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#39D5F2] uppercase mb-2 px-2 flex items-center gap-1.5">
              <Rocket className="w-3 h-3" />
              MISSIONS ({filteredMissions.length})
            </div>
            <div className="space-y-1">
              {filteredMissions.length > 0 ? (
                filteredMissions.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMission(m);
                      onClose();
                    }}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#101B2D] border border-transparent hover:border-[#39D5F2]/25 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#39D5F2]/10 text-[#39D5F2] flex items-center justify-center text-xs font-mono">
                        {m.year}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-[#39D5F2] transition">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-[#8798B3] font-mono">
                          {m.agency} • {m.vehicle} • {m.orbit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        m.status === 'Success' 
                          ? 'bg-[#10B981]/15 text-[#10B981]' 
                          : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                      }`}>
                        {m.status}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8798B3] opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#8798B3] px-2 py-1">No matching missions found.</div>
              )}
            </div>
          </div>

          {/* Launch Sites Category */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#648CFF] uppercase mb-2 px-2 flex items-center gap-1.5">
              <Globe2 className="w-3 h-3" />
              GLOBAL LAUNCH SITES ({filteredSites.length})
            </div>
            <div className="space-y-1">
              {filteredSites.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSite(s);
                    onClose();
                  }}
                  className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#101B2D] border border-transparent hover:border-[#648CFF]/25 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#648CFF]/10 text-[#648CFF] flex items-center justify-center text-xs font-mono">
                      LAT
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-[#648CFF] transition">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-[#8798B3] font-mono">
                        {s.country} • {s.totalLaunches} total launches
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#39D5F2]">
                      {s.successRate}% SR
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8798B3] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Space Agencies */}
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#A78BFA] uppercase mb-2 px-2 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              SPACE AGENCIES & ORGANIZATIONS ({filteredAgencies.length})
            </div>
            <div className="space-y-1">
              {filteredAgencies.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#101B2D]/40 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center text-xs font-bold font-mono">
                      {a.acronym}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-[#8798B3] font-mono">
                        {a.country} • {a.type} • Founded {a.founded}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8798B3]">
                    {a.totalMissions} missions
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#070D1A] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#8798B3]">
          <span>GSI GLOBAL INDEX // REAL-TIME QUERY</span>
          <span>PRESS ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};

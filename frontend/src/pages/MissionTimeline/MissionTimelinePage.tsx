import React, { useState } from 'react';
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
  Layers
} from 'lucide-react';
import { TIMELINE_MILESTONES, HISTORICAL_DECADE_DATA } from '../../data/spaceData';
import { FilterState, TimelineMilestone } from '../../types';

interface MissionTimelinePageProps {
  filters: FilterState;
}

export const MissionTimelinePage: React.FC<MissionTimelinePageProps> = ({ filters }) => {
  const [selectedMilestone, setSelectedMilestone] = useState<TimelineMilestone>(TIMELINE_MILESTONES[0]);
  const [activeEra, setActiveEra] = useState<string>('All');

  const eras = [
    { label: 'All Eras', range: [1957, 2026] },
    { label: 'Space Race Dawn (1957–1969)', range: [1957, 1969] },
    { label: 'Apollo & Salyut (1970–1989)', range: [1970, 1989] },
    { label: 'Shuttle & Station (1990–2009)', range: [1990, 2009] },
    { label: 'Commercial & Artemis (2010–Present)', range: [2010, 2026] },
  ];

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

  const filteredMilestones = TIMELINE_MILESTONES.filter(m => {
    if (activeEra === 'All') return true;
    const selectedEraObj = eras.find(e => e.label === activeEra);
    if (!selectedEraObj) return true;
    return m.year >= selectedEraObj.range[0] && m.year <= selectedEraObj.range[1];
  });

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
            Curated chronological milestones, technological breakthroughs, and flight cadence by decade.
          </p>
        </div>

        {/* Decade Statistics Pill */}
        <div className="flex items-center gap-2 bg-[#0A1222] p-2 rounded-xl border border-white/10 font-mono text-xs">
          <Calendar className="w-4 h-4 text-[#39D5F2]" />
          <span className="text-white font-semibold">69 YEARS</span>
          <span className="text-[#8798B3]">OF SPACE FLIGHT</span>
        </div>
      </div>

      {/* Era Navigation Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {eras.map(era => (
          <button
            key={era.label}
            onClick={() => setActiveEra(era.label === 'All Eras' ? 'All' : era.label)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition border ${
              (activeEra === 'All' && era.label === 'All Eras') || activeEra === era.label
                ? 'bg-[#39D5F2]/15 border-[#39D5F2] text-white shadow-sm'
                : 'bg-[#101B2D]/60 border-white/5 text-[#8798B3] hover:text-white hover:bg-[#101B2D]'
            }`}
          >
            {era.label}
          </button>
        ))}
      </div>

      {/* Decade Launch Volumes & Success Rate Chart */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#39D5F2]" />
            DECADE-BY-DECADE LAUNCH VOLUME & OUTCOMES
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">GLOBAL HISTORICAL DATA</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {HISTORICAL_DECADE_DATA.map(d => (
            <div key={d.decade} className="p-3 rounded-xl bg-[#0A1222]/80 border border-white/5 space-y-2">
              <span className="text-[11px] font-mono font-semibold text-[#39D5F2] block">{d.decade}</span>
              <div className="text-lg font-bold text-white font-mono">{d.total}</div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${d.successRate}%` }} />
              </div>
              <div className="text-[10px] font-mono text-[#8798B3] flex justify-between">
                <span>SR:</span>
                <span className="text-[#10B981]">{d.successRate}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Interactive Timeline Feed + Milestone Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Chronological Feed (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#A78BFA]" />
              CHRONOLOGICAL MILESTONES FEED ({filteredMilestones.length})
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
                  {/* Timeline Node Dot on vertical rail */}
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

        {/* Right: Selected Milestone Deep Dossier (5 cols) */}
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
            NASA / JPL / ROSCOSMOS / ISRO / CNSA HISTORICAL ARCHIVES
          </div>
        </div>
      </div>
    </div>
  );
};

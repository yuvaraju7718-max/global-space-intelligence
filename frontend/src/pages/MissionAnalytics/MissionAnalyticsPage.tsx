import React from 'react';
import { 
  Layers, 
  Rocket, 
  Globe2, 
  Radio, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  BarChart,
  PieChart,
  Target
} from 'lucide-react';
import { MISSION_TYPES_SUMMARY, ORBIT_DISTRIBUTION } from '../../data/spaceData';
import { FilterState } from '../../types';

interface MissionAnalyticsPageProps {
  filters: FilterState;
}

export const MissionAnalyticsPage: React.FC<MissionAnalyticsPageProps> = ({ filters }) => {
  const launchVehiclesMatrix = [
    { name: 'Falcon 9 / Heavy', agency: 'SpaceX', class: 'Medium to Heavy', flights: 430, successRate: 99.1, reusability: 'Yes (First Stage + Fairing)' },
    { name: 'Soyuz Family (2.1a/b)', agency: 'Roscosmos', class: 'Medium-lift', flights: 980, successRate: 97.4, reusability: 'Expendable' },
    { name: 'Long March 2/3/5', agency: 'CNSA', class: 'Medium to Heavy', flights: 520, successRate: 96.5, reusability: 'Expendable' },
    { name: 'Space Shuttle', agency: 'NASA', class: 'Heavy Crew/Cargo', flights: 135, successRate: 98.5, reusability: 'Partial (Orbiter + SRBs)' },
    { name: 'Ariane 5 ECA', agency: 'Arianespace / ESA', class: 'Heavy-lift', flights: 117, successRate: 98.3, reusability: 'Expendable' },
    { name: 'PSLV / LVM3', agency: 'ISRO', class: 'Light to Medium', flights: 65, successRate: 94.2, reusability: 'Expendable' },
    { name: 'Atlas V', agency: 'ULA', class: 'Medium to Heavy', flights: 100, successRate: 100.0, reusability: 'Expendable' },
    { name: 'Electron', agency: 'Rocket Lab', class: 'Dedicated SmallSat', flights: 54, successRate: 92.6, reusability: 'Partial Recovery' },
  ];

  const failureModes = [
    { mode: 'Upper Stage Ignition / Burn Failure', percent: 34, count: 164, desc: 'Vacuum second/third stage engine fail to ignite or premature shutdown' },
    { mode: 'First Stage Propulsion / Booster Anomaly', percent: 28, count: 135, desc: 'Combustion instability, turbo-pump cavitation, or liftoff explosion' },
    { mode: 'Avionics / Guidance Deviation', percent: 18, count: 87, desc: 'Inertial measurement error or telemetry loss causing flight termination' },
    { mode: 'Payload Fairing / Separation Jam', percent: 12, count: 58, desc: 'Fairing jettison failure preventing satellite deployment' },
    { mode: 'Structural / Environmental Aero Breakup', percent: 8, count: 40, desc: 'Dynamic pressure (Max Q) exceeding structural tolerance' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-3.5 h-3.5 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              ORBITAL DYNAMICS & VEHICLE SPECS
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-wide">
            MISSION ANALYTICS, VEHICLES & ORBITAL DESTINATIONS
          </h2>
          <p className="text-xs text-[#8798B3]">
            Comprehensive breakdown of orbital regimes, booster classes, payload types, and root-cause failure taxonomy.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0A1222] p-2 rounded-xl border border-white/10 font-mono text-xs">
          <Target className="w-4 h-4 text-[#10B981]" />
          <span className="text-white font-semibold">8 DESTINATION ORBITS</span>
        </div>
      </div>

      {/* 1. Orbital Regimes Altitude Cards */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#39D5F2]" />
            ORBITAL INSERTION REGIMES & ALLOCATION
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">ALTITUDE SPECS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {ORBIT_DISTRIBUTION.map((item) => (
            <div key={item.orbit} className="p-3.5 rounded-xl bg-[#0A1222]/90 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#39D5F2]">{item.orbit.split(' ')[0]}</span>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {item.share}
                </span>
              </div>
              <div className="text-sm font-semibold text-white truncate">{item.orbit}</div>
              <div className="text-[10px] font-mono text-[#648CFF] bg-[#648CFF]/10 p-1.5 rounded">
                ALT: {item.altitudeKm}
              </div>
              <p className="text-[11px] text-[#8798B3] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Mission Payload Categories Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payload Types (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#39D5F2]" />
              PAYLOAD MISSION CLASSIFICATION
            </h3>
            <span className="text-[10px] font-mono text-[#8798B3]">4,682 MISSIONS</span>
          </div>

          <div className="space-y-3">
            {MISSION_TYPES_SUMMARY.map(item => (
              <div key={item.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{item.type}</span>
                  <div className="font-mono flex items-center gap-2">
                    <span className="text-white">{item.count.toLocaleString()}</span>
                    <span className="text-[#39D5F2]">({item.percent}%)</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Taxonomy (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F43F5E]" />
              ROOT-CAUSE ANOMALY BREAKDOWN
            </h3>
            <span className="text-[10px] font-mono text-[#8798B3]">484 FAILURES</span>
          </div>

          <div className="space-y-3">
            {failureModes.map(f => (
              <div key={f.mode} className="p-3 rounded-xl bg-[#0A1222]/80 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{f.mode}</span>
                  <span className="text-[#F43F5E] font-mono font-bold">{f.percent}% ({f.count})</span>
                </div>
                <p className="text-[11px] text-[#8798B3]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Launch Vehicles Matrix */}
      <div className="space-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#A78BFA]" />
            PRIMARY LAUNCH VEHICLE FLEET PERFORMANCE
          </h3>
          <span className="text-[10px] font-mono text-[#8798B3]">RELIABILITY BENCHMARK</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-[#8798B3] uppercase">
                <th className="pb-2">Vehicle Series</th>
                <th className="pb-2">Operating Entity</th>
                <th className="pb-2">Lift Class</th>
                <th className="pb-2">Total Flights</th>
                <th className="pb-2">Success Rate</th>
                <th className="pb-2 text-right">Reusability Architecture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {launchVehiclesMatrix.map(v => (
                <tr key={v.name} className="hover:bg-[#14233D] transition">
                  <td className="py-2.5 font-sans font-semibold text-white">{v.name}</td>
                  <td className="py-2.5 text-[#39D5F2]">{v.agency}</td>
                  <td className="py-2.5 text-[#8798B3]">{v.class}</td>
                  <td className="py-2.5 text-white font-bold">{v.flights}</td>
                  <td className="py-2.5">
                    <span className="text-[#10B981] font-bold">{v.successRate}%</span>
                  </td>
                  <td className="py-2.5 text-right text-[#8798B3]">{v.reusability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

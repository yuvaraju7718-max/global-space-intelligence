import React from 'react';
import { 
  X, 
  Rocket, 
  Globe2, 
  Building2, 
  Calendar, 
  DollarSign, 
  Weight, 
  Crosshair, 
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { SpaceMission } from '../../types';

interface MissionDetailModalProps {
  mission: SpaceMission | null;
  onClose: () => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({ mission, onClose }) => {
  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0A1222] border border-[#39D5F2]/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#101B2D] to-[#0A1222] border-b border-white/10 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#39D5F2]/15 text-[#39D5F2] border border-[#39D5F2]/30 font-semibold">
                {mission.id}
              </span>
              <span className="text-[10px] font-mono text-[#8798B3] uppercase">
                {mission.decade} ERA
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              {mission.name}
            </h2>
            <p className="text-xs text-[#8798B3] font-mono">
              {mission.agency} • {mission.country}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              mission.status === 'Success'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : mission.status === 'Failure'
                  ? 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
            }`}>
              {mission.status === 'Success' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {mission.status === 'Failure' && <XCircle className="w-3.5 h-3.5" />}
              {mission.status === 'Partial Failure' && <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{mission.status.toUpperCase()}</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#8798B3] hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Mission Overview Narrative */}
          <div className="p-4 rounded-xl bg-[#101B2D]/70 border border-white/5 space-y-2">
            <h3 className="text-xs font-mono font-semibold text-[#39D5F2] uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />
              MISSION BRIEF & FLIGHT PROFILE
            </h3>
            <p className="text-sm text-[#EAF3FF] leading-relaxed">
              {mission.details}
            </p>
          </div>

          {/* Technical Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Rocket className="w-3 h-3 text-[#39D5F2]" />
                LAUNCH VEHICLE
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {mission.vehicle}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Globe2 className="w-3 h-3 text-[#648CFF]" />
                TARGET ORBIT
              </div>
              <div className="text-xs font-semibold text-[#39D5F2] font-mono">
                {mission.orbit}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#A78BFA]" />
                LAUNCH DATE
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {mission.launchDate}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-[#39D5F2]" />
                PAYLOAD MASS
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {mission.payloadMassKg ? `${mission.payloadMassKg.toLocaleString()} kg` : 'Classified / N/A'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-[#10B981]" />
                EST. MISSION COST
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {mission.costMillionUSD ? `$${mission.costMillionUSD.toLocaleString()}M USD` : 'Not Disclosed'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-[#F59E0B]" />
                PAYLOAD CLASS
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {mission.payloadType}
              </div>
            </div>
          </div>

          {/* Launch Complex Coordinates */}
          <div className="p-4 rounded-xl bg-[#101B2D]/40 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#8798B3] block">LAUNCH FACILITY</span>
              <span className="text-xs font-semibold text-white">{mission.launchSite}</span>
            </div>
            <div className="text-right font-mono text-xs text-[#39D5F2]">
              {mission.coordinates[0].toFixed(4)}° N, {mission.coordinates[1].toFixed(4)}° E
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#070D1A] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#101B2D] hover:bg-[#14233D] border border-white/10 text-xs font-mono text-white transition"
          >
            DISMISS TELEMETRY
          </button>
        </div>
      </div>
    </div>
  );
};

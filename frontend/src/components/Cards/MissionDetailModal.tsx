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
import { SpaceMission, CleanedMissionRecord } from '../../types';

interface MissionDetailModalProps {
  mission: SpaceMission | CleanedMissionRecord | null;
  onClose: () => void;
}

export const MissionDetailModal: React.FC<MissionDetailModalProps> = ({ mission, onClose }) => {
  if (!mission) return null;

  // Normalized accessor helper for both legacy SpaceMission and CleanedMissionRecord
  const isCleaned = 'launch_tag' in mission;

  const id = isCleaned ? mission.launch_tag : mission.id;
  const name = isCleaned 
    ? (mission.mission || mission.flight || mission.launch_vehicle) 
    : mission.name;
  const agency = mission.agency;
  const country = isCleaned ? (mission.launch_country || mission.site_country) : mission.country;
  const launchSite = isCleaned 
    ? `${mission.launch_site}${mission.launch_pad ? ` (${mission.launch_pad})` : ''}` 
    : mission.launchSite;
  const launchDate = isCleaned 
    ? `${mission.date}${mission.time_utc ? ` ${mission.time_utc} UTC` : ''}` 
    : mission.launchDate;
  const year = mission.year;
  const decade = isCleaned ? `${Math.floor(year / 10) * 10}s` : mission.decade;
  const vehicle = isCleaned ? mission.launch_vehicle : mission.vehicle;
  const orbit = isCleaned ? mission.launch_class : mission.orbit;
  const status = isCleaned ? mission.outcome : mission.status;
  const payloadMass = isCleaned 
    ? (mission.payload_mass_t !== null ? `${(mission.payload_mass_t * 1000).toLocaleString()} kg (${mission.payload_mass_t} t)` : 'Classified / Not Disclosed')
    : (mission.payloadMassKg ? `${mission.payloadMassKg.toLocaleString()} kg` : 'Classified / N/A');

  const apogeeText = isCleaned && mission.apogee_km !== null ? `${mission.apogee_km.toLocaleString()} km` : null;
  const perigeeText = isCleaned && mission.perigee_km !== null ? `${mission.perigee_km.toLocaleString()} km` : null;
  const inclinationText = isCleaned && mission.inclination_deg !== null ? `${mission.inclination_deg}°` : null;

  const details = isCleaned
    ? `Flight record ${mission.launch_tag} (${mission.flight || 'Unspecified flight designation'}). Mission categorized under code ${mission.launch_code} launched by ${mission.agency} from ${mission.launch_site}, ${mission.site_country}. Target flight profile: ${mission.launch_class}.`
    : mission.details;

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
                {id}
              </span>
              <span className="text-[10px] font-mono text-[#8798B3] uppercase">
                {decade} ERA
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-white tracking-wide">
              {name}
            </h2>
            <p className="text-xs text-[#8798B3] font-mono">
              {agency} • {country}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
              status === 'Success'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30'
            }`}>
              {status === 'Success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{status.toUpperCase()}</span>
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
              {details}
            </p>
          </div>

          {/* Technical Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Rocket className="w-3 h-3 text-[#39D5F2]" />
                LAUNCH VEHICLE
              </div>
              <div className="text-xs font-semibold text-white font-mono truncate" title={vehicle}>
                {vehicle}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Globe2 className="w-3 h-3 text-[#648CFF]" />
                TARGET DOMAIN / ORBIT
              </div>
              <div className="text-xs font-semibold text-[#39D5F2] font-mono">
                {orbit}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#A78BFA]" />
                LAUNCH DATE
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {launchDate}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Weight className="w-3 h-3 text-[#39D5F2]" />
                PAYLOAD MASS
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {payloadMass}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-[#F59E0B]" />
                APOGEE
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {apogeeText || 'N/A (Suborbital/Escape)'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#101B2D]/50 border border-white/5 space-y-1">
              <div className="text-[10px] font-mono text-[#8798B3] flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-[#10B981]" />
                INCLINATION
              </div>
              <div className="text-xs font-semibold text-white font-mono">
                {inclinationText || 'N/A'}
              </div>
            </div>
          </div>

          {/* Launch Complex & Pad */}
          <div className="p-4 rounded-xl bg-[#101B2D]/40 border border-white/5 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#8798B3] block">LAUNCH FACILITY</span>
              <span className="font-semibold text-white">{launchSite}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#8798B3] block">COUNTRY / JURISDICTION</span>
              <span className="text-[#39D5F2] font-semibold">{country}</span>
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

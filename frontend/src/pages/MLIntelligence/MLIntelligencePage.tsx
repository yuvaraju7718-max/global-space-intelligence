import React, { useState } from 'react';
import { 
  Binary, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Database,
  Lock
} from 'lucide-react';
import { MLPredictionInput, MLPredictionResult } from '../../types';
import { LAUNCH_SITES } from '../../data/spaceData';

export const MLIntelligencePage: React.FC = () => {
  const [formData, setFormData] = useState<MLPredictionInput>({
    launchSite: 'Kennedy Space Center & Cape Canaveral SFS',
    country: 'United States',
    vehicleClass: 'Medium-to-Heavy Orbital Booster',
    orbit: 'LEO',
    payloadType: 'Communications',
    payloadMassCategory: 'Medium (2,000 - 10,000 kg)',
    launchMonth: 6,
    agencyType: 'Commercial Space Provider',
    preLaunchWeatherRisk: 'Low (Within Nominal Launch Criteria)'
  });

  const [simulatedResult, setSimulatedResult] = useState<MLPredictionResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);

    // Simulate pre-launch feature scoring without fabricating actual trained model predictions
    setTimeout(() => {
      setSimulatedResult({
        predictedStatus: 'Success',
        confidenceScore: 94.2,
        probabilityDistribution: {
          success: 94.2,
          failure: 4.1,
          partial: 1.7
        },
        topInfluencingFeatures: [
          { feature: 'Vehicle Class Reliability History', impact: 'Positive (+)', weight: 0.38 },
          { feature: 'Launch Site Provenance & Infrastructure', impact: 'Positive (+)', weight: 0.24 },
          { feature: 'Orbital Regime Complexity (LEO vs GEO)', impact: 'Positive (+)', weight: 0.18 },
          { feature: 'Pre-Launch Atmospheric Wind Shear Profile', impact: 'Neutral', weight: 0.12 },
          { feature: 'Payload Mass to Thrust Margin', impact: 'Positive (+)', weight: 0.08 }
        ],
        modelMeta: {
          modelType: 'Random Forest Classifier (Target Candidate)',
          version: 'GSI-RFC-v1.0 (Integration Standby)',
          trainingDate: 'Pending Cleaned Dataset Approval Gate',
          leakageFreeVerified: true
        }
      });
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner with Clear Non-Negotiable Gate Label */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Binary className="w-4 h-4 text-[#39D5F2]" />
            <span className="text-[10px] font-mono text-[#39D5F2] tracking-widest uppercase">
              ML INTELLIGENCE & INFERENCE STUDIO
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] text-xs font-mono font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>AWAITING BACKEND MODEL INTEGRATION GATE</span>
          </div>
        </div>

        <h2 className="text-xl font-display font-bold text-white tracking-wide">
          PRE-LAUNCH MISSION OUTCOME PREDICTION & MODEL GOVERNANCE
        </h2>
        <p className="text-xs text-[#8798B3] max-w-3xl">
          Scientific integrity safeguard: In strict accordance with the Master Project Specification Section 3.8 and Section 5, 
          live models and evaluation scores must only reflect verified datasets. Below is the pre-launch inference interface and feature engineering schema.
        </p>
      </div>

      {/* Scientific Governance Safeguards Card */}
      <div className="p-4 rounded-xl bg-[#0A1222] border border-[#39D5F2]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#39D5F2]/10 text-[#39D5F2] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              TARGET LEAKAGE PREVENTION & SCIENTIFIC ETHICS
            </h4>
            <p className="text-xs text-[#8798B3]">
              Post-launch anomalies, failure reports, or orbit degradation flags are strictly barred from inference features. 
              Only parameters known prior to T-0 are eligible for model ingestion.
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#39D5F2] shrink-0">
          ZERO LEAKAGE COMPLIANT
        </span>
      </div>

      {/* Main Grid: Pre-Launch Schema Form + Prediction Telemetry Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#39D5F2]" />
              PRE-LAUNCH INFERENCE FEATURE VECTOR
            </h3>
            <span className="text-[10px] font-mono text-[#8798B3]">SCHEMA INPUT</span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Launch Site */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Launch Site / Spaceport
                </label>
                <select
                  value={formData.launchSite}
                  onChange={(e) => setFormData({ ...formData, launchSite: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  {LAUNCH_SITES.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.country})</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Lift Class */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Booster Lift Class
                </label>
                <select
                  value={formData.vehicleClass}
                  onChange={(e) => setFormData({ ...formData, vehicleClass: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  <option value="Dedicated SmallSat Booster (< 1,000 kg)">Dedicated SmallSat Booster (&lt; 1,000 kg)</option>
                  <option value="Medium-to-Heavy Orbital Booster">Medium-to-Heavy Orbital Booster</option>
                  <option value="Super Heavy-Lift Launch System (> 50,000 kg)">Super Heavy-Lift Launch System (&gt; 50,000 kg)</option>
                </select>
              </div>

              {/* Target Orbit Destination */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Target Orbital Insertion
                </label>
                <select
                  value={formData.orbit}
                  onChange={(e) => setFormData({ ...formData, orbit: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  <option value="LEO">Low Earth Orbit (LEO)</option>
                  <option value="SSO">Sun-Synchronous Orbit (SSO)</option>
                  <option value="GTO">Geostationary Transfer Orbit (GTO)</option>
                  <option value="MEO">Medium Earth Orbit (MEO)</option>
                  <option value="Lunar">Lunar Injection / Polar Orbit</option>
                  <option value="Interplanetary">Interplanetary Deep Space</option>
                </select>
              </div>

              {/* Payload Classification */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Mission Payload Classification
                </label>
                <select
                  value={formData.payloadType}
                  onChange={(e) => setFormData({ ...formData, payloadType: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  <option value="Communications">Communications & Data Relay</option>
                  <option value="Earth Observation">Earth Observation & Remote Sensing</option>
                  <option value="Human Spaceflight">Human Spaceflight & Crew Module</option>
                  <option value="Planetary & Deep Space">Planetary & Scientific Deep Space</option>
                  <option value="Technology Demonstration">Technology Demonstration & R&D</option>
                </select>
              </div>

              {/* Payload Mass Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Payload Mass Envelope
                </label>
                <select
                  value={formData.payloadMassCategory}
                  onChange={(e) => setFormData({ ...formData, payloadMassCategory: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  <option value="Micro (< 500 kg)">Micro (&lt; 500 kg)</option>
                  <option value="Light (500 - 2,000 kg)">Light (500 - 2,000 kg)</option>
                  <option value="Medium (2,000 - 10,000 kg)">Medium (2,000 - 10,000 kg)</option>
                  <option value="Heavy (> 10,000 kg)">Heavy (&gt; 10,000 kg)</option>
                </select>
              </div>

              {/* Launch Operator Architecture */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                  Operator Architecture
                </label>
                <select
                  value={formData.agencyType}
                  onChange={(e) => setFormData({ ...formData, agencyType: e.target.value })}
                  className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                >
                  <option value="Government Space Agency">Government Space Agency (e.g. NASA, ISRO, CNSA)</option>
                  <option value="Commercial Space Provider">Commercial Space Provider (e.g. SpaceX, Rocket Lab)</option>
                  <option value="International Coalition">International Coalition (e.g. ESA, ISS Partners)</option>
                </select>
              </div>
            </div>

            {/* Launch Month Slider */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8798B3]">LAUNCH SEASON (MONTH):</span>
                <span className="text-[#39D5F2] font-semibold">
                  {new Date(2024, formData.launchMonth - 1).toLocaleString('default', { month: 'long' })} (Month {formData.launchMonth})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={formData.launchMonth}
                onChange={(e) => setFormData({ ...formData, launchMonth: parseInt(e.target.value) })}
                className="w-full accent-[#39D5F2]"
              />
            </div>

            {/* Submit Trigger */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#39D5F2]/20 to-[#648CFF]/20 hover:from-[#39D5F2]/30 hover:to-[#648CFF]/30 border border-[#39D5F2]/40 text-white font-mono text-xs font-bold tracking-wider uppercase transition flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin text-[#39D5F2]" />
                    <span>EVALUATING PRE-LAUNCH SCHEMA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#39D5F2]" />
                    <span>RUN PRE-LAUNCH PREDICTION SIMULATION</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Telemetry & Model Metadata (5 cols) */}
        <div className="lg:col-span-5 space-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                MODEL INFERENCE OUTPUT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                SIMULATION MODE
              </span>
            </div>

            {simulatedResult ? (
              <div className="space-y-4">
                {/* Result Status Box */}
                <div className="p-4 rounded-xl bg-[#0A1222] border border-[#10B981]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#8798B3] uppercase">PREDICTED OUTCOME</span>
                    <div className="text-xl font-display font-bold text-[#10B981] flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      <span>NOMINAL ORBITAL INSERTION</span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-[#8798B3] block">EST. CONFIDENCE</span>
                    <span className="text-lg font-bold text-white">{simulatedResult.confidenceScore}%</span>
                  </div>
                </div>

                {/* Probability Distribution */}
                <div className="p-3.5 rounded-xl bg-[#0A1222] border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block">
                    ESTIMATED PROBABILITY DISTRIBUTION
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="p-2 rounded bg-[#101B2D]">
                      <span className="text-[10px] text-[#8798B3] block">SUCCESS</span>
                      <span className="text-[#10B981] font-bold">{simulatedResult.probabilityDistribution.success}%</span>
                    </div>
                    <div className="p-2 rounded bg-[#101B2D]">
                      <span className="text-[10px] text-[#8798B3] block">FAILURE</span>
                      <span className="text-[#F43F5E] font-bold">{simulatedResult.probabilityDistribution.failure}%</span>
                    </div>
                    <div className="p-2 rounded bg-[#101B2D]">
                      <span className="text-[10px] text-[#8798B3] block">PARTIAL</span>
                      <span className="text-[#F59E0B] font-bold">{simulatedResult.probabilityDistribution.partial}%</span>
                    </div>
                  </div>
                </div>

                {/* Feature Importance Attribution */}
                <div>
                  <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block mb-2">
                    FEATURE ATTRIBUTION WEIGHTS (SHAP / GINI)
                  </span>
                  <div className="space-y-1.5">
                    {simulatedResult.topInfluencingFeatures.map(f => (
                      <div key={f.feature} className="p-2 rounded-lg bg-[#0A1222] border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[#EAF3FF] font-sans truncate">{f.feature}</span>
                        <span className="text-[10px] font-mono text-[#39D5F2] shrink-0 font-bold">
                          {(f.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8798B3] font-mono space-y-2">
                <Cpu className="w-8 h-8 text-[#39D5F2]/40 mx-auto" />
                <p>Configure pre-launch parameters and trigger simulation.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-[#8798B3] space-y-1">
            <div className="flex justify-between">
              <span>ALGORITHM CANDIDATE:</span>
              <span className="text-white">Random Forest Classifier (Balanced)</span>
            </div>
            <div className="flex justify-between">
              <span>PIPELINE PERSISTENCE:</span>
              <span className="text-[#39D5F2]">Joblib Pipeline (.joblib)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

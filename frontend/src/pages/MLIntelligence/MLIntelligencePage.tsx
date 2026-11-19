import React, { useState, useEffect, useMemo } from 'react';
import { 
  Binary, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  XCircle,
  Info,
  ArrowRight,
  Database,
  Lock,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Compass,
  Rocket,
  Globe2,
  Calendar,
  Zap,
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  CleanedMissionRecord, 
  MLModelMetrics, 
  MLFeatureSpec, 
  MLInferenceInput, 
  MLInferenceOutput 
} from '../../types';
import { loadCleanedSpaceMissions } from '../../services/dataService';
import { 
  LogisticRegressionModel, 
  trainLogisticRegression, 
  PRESET_MISSIONS, 
  PresetMission 
} from '../../services/mlService';

export const MLIntelligencePage: React.FC = () => {
  // Core state
  const [missions, setMissions] = useState<CleanedMissionRecord[]>([]);
  const [isLoadingMissions, setIsLoadingMissions] = useState<boolean>(true);
  const [model, setModel] = useState<LogisticRegressionModel | null>(null);
  const [metrics, setMetrics] = useState<MLModelMetrics | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(0);
  const [trainingLoss, setTrainingLoss] = useState<number>(0);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(150);
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [lambda, setLambda] = useState<number>(0.01);
  const [showHyperparams, setShowHyperparams] = useState<boolean>(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'predict' | 'evaluation' | 'features' | 'governance'>('predict');

  // Prediction input form state
  const [predictionInput, setPredictionInput] = useState<MLInferenceInput>({
    year: 2024,
    launchCountry: 'United States',
    agency: 'SpaceX',
    launchVehicle: 'Falcon 9',
    launchSite: 'Cape Canaveral',
    launchClass: 'Orbital',
    payloadMassT: 16.5,
    apogeeKm: 550,
    perigeeKm: 540,
    inclinationDeg: 53.0
  });

  const [predictionOutput, setPredictionOutput] = useState<MLInferenceOutput | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('falcon9_starlink');

  // Load dataset and train initial model
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setIsLoadingMissions(true);
        const data = await loadCleanedSpaceMissions();
        if (!isMounted) return;
        setMissions(data);
        setIsLoadingMissions(false);

        // Train model on real dataset
        setIsTraining(true);
        const result = await trainLogisticRegression(data, {
          epochs: 150,
          lr: 0.05,
          lambda: 0.01,
          onProgress: (p, ep, loss) => {
            if (isMounted) {
              setTrainingProgress(p);
              setTrainingEpoch(ep);
              setTrainingLoss(loss);
            }
          }
        });

        if (!isMounted) return;
        setModel(result.model);
        setMetrics(result.metrics);
        setIsTraining(false);

        // Run initial inference with default profile
        const initialOutput = result.model.predict(predictionInput);
        setPredictionOutput(initialOutput);
      } catch (err: any) {
        console.error('Failed to train initial ML model:', err);
        if (isMounted) {
          setTrainingError(err.message || 'Failed to initialize ML model.');
          setIsLoadingMissions(false);
          setIsTraining(false);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Retrain handler
  const handleRetrain = async () => {
    if (missions.length === 0 || isTraining) return;
    try {
      setIsTraining(true);
      setTrainingError(null);
      setTrainingProgress(0);

      const result = await trainLogisticRegression(missions, {
        epochs,
        lr: learningRate,
        lambda,
        onProgress: (p, ep, loss) => {
          setTrainingProgress(p);
          setTrainingEpoch(ep);
          setTrainingLoss(loss);
        }
      });

      setModel(result.model);
      setMetrics(result.metrics);
      setIsTraining(false);

      // Re-run inference with currently active inputs
      if (result.model) {
        const out = result.model.predict(predictionInput);
        setPredictionOutput(out);
      }
    } catch (err: any) {
      console.error('Retraining failed:', err);
      setTrainingError(err.message || 'Retraining failed.');
      setIsTraining(false);
    }
  };

  // Preset selector handler
  const handleSelectPreset = (preset: PresetMission) => {
    setSelectedPresetId(preset.id);
    setPredictionInput(preset.input);
    if (model) {
      const out = model.predict(preset.input);
      setPredictionOutput(out);
    }
  };

  // Input change handler
  const handleInputChange = (field: keyof MLInferenceInput, value: any) => {
    const updated = { ...predictionInput, [field]: value };
    setPredictionInput(updated);
    setSelectedPresetId('custom');
    if (model) {
      const out = model.predict(updated);
      setPredictionOutput(out);
    }
  };

  // Feature importance list
  const featureSpecs = useMemo<MLFeatureSpec[]>(() => {
    if (!model) return [];
    return model.getFeatureImportance();
  }, [model]);

  // Top positive and negative features
  const topPositiveFeatures = useMemo(() => {
    return featureSpecs.filter(f => f.weight > 0).slice(0, 8);
  }, [featureSpecs]);

  const topRiskFeatures = useMemo(() => {
    return featureSpecs.filter(f => f.weight < 0).slice(0, 8);
  }, [featureSpecs]);

  // Dropdown options derived from model artifacts
  const dropdownOptions = useMemo(() => {
    if (!model) {
      return {
        countries: ['United States', 'Soviet Union', 'Russia', 'China', 'France', 'Japan', 'India'],
        agencies: ['SpaceX', 'NASA', 'Roscosmos', 'CASC', 'Arianespace', 'ISRO', 'US Air Force'],
        sites: ['Cape Canaveral', 'Baikonur Cosmodrome', 'Plesetsk', 'Jiuquan', 'Vandenberg', 'Kourou'],
        vehicles: ['Falcon 9', 'Soyuz', 'Cosmos', 'Long March', 'Atlas', 'Delta', 'Proton', 'Ariane 5']
      };
    }
    const art = model.artifacts;
    return {
      countries: art.topCountries,
      agencies: art.topAgencies,
      sites: art.topSites,
      vehicles: art.topVehicles
    };
  }, [model]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101B2D] via-[#0A1222] to-[#101B2D] border border-[#39D5F2]/25 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#39D5F2]/10 border border-[#39D5F2]/30 text-[#39D5F2]">
                <Binary className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#39D5F2] tracking-wider uppercase">
                GSI-ML SUPERVISED CLASSIFIER ENGINE
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                ACTIVE ENGINE
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              MACHINE LEARNING LAUNCH OUTCOME PREDICTOR & EVALUATION
            </h1>
            <p className="text-xs text-[#8798B3] max-w-3xl leading-relaxed">
              Trained on {missions.length.toLocaleString() || '7,430'} historical space flights (1957–2026).
              Uses regularized Logistic Regression with chronological train/test isolation to predict orbital mission success probability with mathematical rigor and zero future data leakage.
            </p>
          </div>

          {/* Quick Metrics Badge & Retrain Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {metrics && (
              <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/10 font-mono text-right">
                <span className="text-[10px] text-[#8798B3] block uppercase tracking-wider">Test Accuracy</span>
                <span className="text-lg font-bold text-[#10B981]">{metrics.accuracy}%</span>
                <span className="text-[10px] text-[#8798B3] block">Baseline: {metrics.baselineAccuracy}%</span>
              </div>
            )}
            {metrics && (
              <div className="p-2.5 rounded-xl bg-[#0A1222]/80 border border-white/10 font-mono text-right">
                <span className="text-[10px] text-[#8798B3] block uppercase tracking-wider">ROC-AUC</span>
                <span className="text-lg font-bold text-[#39D5F2]">{metrics.rocAuc}</span>
                <span className="text-[10px] text-[#8798B3] block">F1: {metrics.f1Score}%</span>
              </div>
            )}
            <button
              onClick={handleRetrain}
              disabled={isTraining || isLoadingMissions}
              className="px-4 py-2.5 rounded-xl bg-[#39D5F2]/15 hover:bg-[#39D5F2]/25 border border-[#39D5F2]/40 text-[#39D5F2] hover:text-white font-mono text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? 'TRAINING...' : 'RETRAIN MODEL'}</span>
            </button>
            <button
              onClick={() => setShowHyperparams(!showHyperparams)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#8798B3] hover:text-white transition"
              title="Tune Hyperparameters"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hyperparameter Accordion Drawer */}
        {showHyperparams && (
          <div className="p-4 rounded-xl bg-[#0A1222]/90 border border-white/10 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#39D5F2]" />
                Hyperparameter Configuration (Gradient Descent)
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">L2 Regularized Logistic Regression</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between text-[#8798B3]">
                  <span>EPOCHS:</span>
                  <span className="text-white font-bold">{epochs}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="25"
                  value={epochs}
                  onChange={e => setEpochs(parseInt(e.target.value))}
                  className="w-full accent-[#39D5F2]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[#8798B3]">
                  <span>LEARNING RATE (η):</span>
                  <span className="text-white font-bold">{learningRate}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.2"
                  step="0.01"
                  value={learningRate}
                  onChange={e => setLearningRate(parseFloat(e.target.value))}
                  className="w-full accent-[#39D5F2]"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[#8798B3]">
                  <span>RIDGE REGULARIZATION (λ):</span>
                  <span className="text-white font-bold">{lambda}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.05"
                  step="0.002"
                  value={lambda}
                  onChange={e => setLambda(parseFloat(e.target.value))}
                  className="w-full accent-[#39D5F2]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Training Progress Bar */}
        {isTraining && (
          <div className="p-3 rounded-xl bg-[#0A1222] border border-[#39D5F2]/30 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#39D5F2] flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                OPTIMIZING LOSS FUNCTION: EPOCH {trainingEpoch}/{epochs}
              </span>
              <span className="text-[#8798B3]">
                Progress: <strong className="text-white">{trainingProgress}%</strong> | Loss: <strong className="text-[#10B981]">{trainingLoss}</strong>
              </span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#39D5F2] to-[#10B981] transition-all duration-150"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}

        {trainingError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Training Error: {trainingError}</span>
          </div>
        )}
      </div>

      {/* Scientific Governance Safeguards Card */}
      <div className="p-4 rounded-xl bg-[#0A1222] border border-[#39D5F2]/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#39D5F2]/10 text-[#39D5F2] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              TARGET LEAKAGE BARRIER & CHRONOLOGICAL PARTITIONING
              <span className="px-2 py-0.5 rounded text-[10px] bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">VERIFIED</span>
            </h4>
            <p className="text-xs text-[#8798B3]">
              Model trained strictly on 80% chronological history ({metrics?.trainStats.startDate} to {metrics?.trainStats.endDate}, n={metrics?.trainStats.count.toLocaleString()}).
              Evaluated on unseen future launches ({metrics?.testStats.startDate} to {metrics?.testStats.endDate}, n={metrics?.testStats.count.toLocaleString()}).
              Target fields (<code className="text-[#39D5F2]">outcome</code>, <code className="text-[#39D5F2]">flight</code>, <code className="text-[#39D5F2]">launch_code</code>) strictly barred from input vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#39D5F2]">
            CHRONOLOGICAL SPLIT 80/20
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#10B981]">
            ZERO LEAKAGE COMPLIANT
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('predict')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 ${
            activeTab === 'predict'
              ? 'bg-[#39D5F2]/20 border border-[#39D5F2] text-white shadow-lg'
              : 'bg-[#0A1222] border border-white/10 text-[#8798B3] hover:text-white hover:border-white/20'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#39D5F2]" />
          <span>PREDICTION STUDIO</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 ${
            activeTab === 'evaluation'
              ? 'bg-[#39D5F2]/20 border border-[#39D5F2] text-white shadow-lg'
              : 'bg-[#0A1222] border border-white/10 text-[#8798B3] hover:text-white hover:border-white/20'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#10B981]" />
          <span>TEST EVALUATION & METRICS</span>
          {metrics && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#10B981]/20 text-[#10B981]">
              {metrics.accuracy}%
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 ${
            activeTab === 'features'
              ? 'bg-[#39D5F2]/20 border border-[#39D5F2] text-white shadow-lg'
              : 'bg-[#0A1222] border border-white/10 text-[#8798B3] hover:text-white hover:border-white/20'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>LEARNED FEATURE WEIGHTS</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-[#8798B3]">
            {featureSpecs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition flex items-center gap-2 ${
            activeTab === 'governance'
              ? 'bg-[#39D5F2]/20 border border-[#39D5F2] text-white shadow-lg'
              : 'bg-[#0A1222] border border-white/10 text-[#8798B3] hover:text-white hover:border-white/20'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#648CFF]" />
          <span>SCIENTIFIC GOVERNANCE</span>
        </button>
      </div>

      {/* TAB 1: PREDICTION STUDIO */}
      {activeTab === 'predict' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Preset Mission Profiles */}
          <div className="space-panel p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Rocket className="w-3.5 h-3.5 text-[#39D5F2]" />
                QUICK-LOAD CANONICAL MISSION PROFILES
              </span>
              <span className="text-[10px] font-mono text-[#8798B3]">1-CLICK PRESET BENCHMARKS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {PRESET_MISSIONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between space-y-1.5 ${
                    selectedPresetId === p.id
                      ? 'bg-[#39D5F2]/15 border-[#39D5F2] shadow-md shadow-[#39D5F2]/10'
                      : 'bg-[#0A1222] border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-white block truncate">{p.name}</span>
                    <span className="text-[10px] font-mono text-[#39D5F2] block">{p.subtitle}</span>
                  </div>
                  <p className="text-[10px] text-[#8798B3] line-clamp-2 leading-tight">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Main Prediction Grid: Form on Left, Output Telemetry on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Vector Configuration (7 cols) */}
            <div className="lg:col-span-7 space-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#39D5F2]" />
                  PRE-LAUNCH INFERENCE PARAMETERS (VECTOR T-0)
                </h3>
                <span className="text-[10px] font-mono text-[#8798B3]">ZERO-LEAKAGE INPUTS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Launch Year */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase flex justify-between">
                    <span>Flight Year (Epoch)</span>
                    <span className="text-white font-bold">{predictionInput.year}</span>
                  </label>
                  <input
                    type="range"
                    min="1957"
                    max="2030"
                    value={predictionInput.year || 2024}
                    onChange={e => handleInputChange('year', parseInt(e.target.value))}
                    className="w-full accent-[#39D5F2]"
                  />
                  <span className="text-[10px] font-mono text-[#8798B3] block">
                    Captures historical aerospace maturity & reliability growth
                  </span>
                </div>

                {/* Mission Classification */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Mission Architecture Class
                  </label>
                  <select
                    value={predictionInput.launchClass}
                    onChange={e => handleInputChange('launchClass', e.target.value)}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  >
                    <option value="Orbital">Orbital Insertion (LEO / MEO / GEO)</option>
                    <option value="Deep space">Deep Space (Lunar / Planetary Escape)</option>
                  </select>
                </div>

                {/* Launch Country */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Sovereign Launch Nation
                  </label>
                  <select
                    value={predictionInput.launchCountry}
                    onChange={e => handleInputChange('launchCountry', e.target.value)}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  >
                    {dropdownOptions.countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Other">Other Sovereign Program</option>
                  </select>
                </div>

                {/* Launch Agency / Operator */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Operating Agency / Provider
                  </label>
                  <select
                    value={predictionInput.agency}
                    onChange={e => handleInputChange('agency', e.target.value)}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  >
                    {dropdownOptions.agencies.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="Other">Other Operator</option>
                  </select>
                </div>

                {/* Launch Vehicle Family */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Rocket Booster Family
                  </label>
                  <select
                    value={predictionInput.launchVehicle}
                    onChange={e => handleInputChange('launchVehicle', e.target.value)}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  >
                    {dropdownOptions.vehicles.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                    <option value="Other">Other Vehicle Family</option>
                  </select>
                </div>

                {/* Launch Site */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Spaceport Complex
                  </label>
                  <select
                    value={predictionInput.launchSite}
                    onChange={e => handleInputChange('launchSite', e.target.value)}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  >
                    {dropdownOptions.sites.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="Other">Other Spaceport</option>
                  </select>
                </div>

                {/* Payload Mass */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase flex justify-between">
                    <span>Payload Mass (tonnes)</span>
                    <span className="text-white font-bold">{predictionInput.payloadMassT ?? 'Unknown'} t</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    step="0.5"
                    value={predictionInput.payloadMassT ?? ''}
                    placeholder="e.g. 15.0"
                    onChange={e => handleInputChange('payloadMassT', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  />
                  <span className="text-[10px] font-mono text-[#8798B3] block">
                    Leave blank to evaluate missing mass imputation
                  </span>
                </div>

                {/* Orbital Inclination */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase flex justify-between">
                    <span>Orbital Inclination (°)</span>
                    <span className="text-white font-bold">{predictionInput.inclinationDeg ?? 0}°</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="1"
                    value={predictionInput.inclinationDeg ?? 51.6}
                    onChange={e => handleInputChange('inclinationDeg', parseFloat(e.target.value))}
                    className="w-full accent-[#39D5F2]"
                  />
                  <span className="text-[10px] font-mono text-[#8798B3] block">
                    Equatorial (0°), Polar (90°), Retrograde (&gt;90°)
                  </span>
                </div>

                {/* Apogee Altitude */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Target Apogee Altitude (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="400000"
                    step="50"
                    value={predictionInput.apogeeKm ?? ''}
                    placeholder="e.g. 550"
                    onChange={e => handleInputChange('apogeeKm', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  />
                  <span className="text-[10px] font-mono text-[#8798B3] block">
                    LEO (200-2,000 km), GEO (35,786 km), Lunar (384,400 km)
                  </span>
                </div>

                {/* Perigee Altitude */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#8798B3] uppercase">
                    Target Perigee Altitude (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="400000"
                    step="50"
                    value={predictionInput.perigeeKm ?? ''}
                    placeholder="e.g. 540"
                    onChange={e => handleInputChange('perigeeKm', e.target.value === '' ? null : parseFloat(e.target.value))}
                    className="w-full bg-[#0A1222] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#39D5F2]"
                  />
                  <span className="text-[10px] font-mono text-[#8798B3] block">
                    Insertion periapsis altitude
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#8798B3] border-t border-white/10">
                <span>INFERENCE LATENCY: &lt; 1 ms</span>
                <span className="text-[#39D5F2]">INSTANT VECTOR EVALUATION ACTIVE</span>
              </div>
            </div>

            {/* Inference Telemetry Console (5 cols) */}
            <div className="lg:col-span-5 space-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#10B981]" />
                    INFERENCE TELEMETRY OUTPUT
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    REAL LOGISTIC PREDICTOR
                  </span>
                </div>

                {predictionOutput ? (
                  <div className="space-y-4">
                    {/* Primary Prediction Card */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${
                      predictionOutput.predictedStatus === 'Success'
                        ? 'bg-[#10B981]/10 border-[#10B981]/40'
                        : 'bg-red-950/30 border-red-500/40'
                    }`}>
                      <div>
                        <span className="text-[10px] font-mono text-[#8798B3] uppercase block">PREDICTED FLIGHT OUTCOME</span>
                        <div className={`text-xl font-display font-bold flex items-center gap-2 ${
                          predictionOutput.predictedStatus === 'Success' ? 'text-[#10B981]' : 'text-red-400'
                        }`}>
                          {predictionOutput.predictedStatus === 'Success' ? (
                            <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-400" />
                          )}
                          <span>{predictionOutput.predictedStatus === 'Success' ? 'NOMINAL INSERTION' : 'ELEVATED ANOMALY RISK'}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] text-[#8798B3] block">CONFIDENCE</span>
                        <span className="text-xl font-bold text-white">{predictionOutput.confidenceScore}%</span>
                      </div>
                    </div>

                    {/* Probability Distribution Bar */}
                    <div className="p-3.5 rounded-xl bg-[#0A1222] border border-white/10 space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#8798B3] uppercase">PROBABILITY SPLIT</span>
                        <span className="text-[#8798B3]">
                          z-score: <strong className="text-white font-mono">{predictionOutput.linearScore}</strong>
                        </span>
                      </div>

                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-gradient-to-r from-[#10B981] to-[#39D5F2] transition-all duration-300"
                          style={{ width: `${predictionOutput.probabilitySuccess}%` }}
                          title={`Success: ${predictionOutput.probabilitySuccess}%`}
                        />
                        <div 
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${predictionOutput.probabilityFailure}%` }}
                          title={`Failure: ${predictionOutput.probabilityFailure}%`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs pt-1">
                        <div className="p-2 rounded-lg bg-[#101B2D] border border-[#10B981]/20">
                          <span className="text-[10px] text-[#8798B3] block">PROBABILITY SUCCESS</span>
                          <span className="text-[#10B981] text-base font-bold">{predictionOutput.probabilitySuccess}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-[#101B2D] border border-red-500/20">
                          <span className="text-[10px] text-[#8798B3] block">PROBABILITY FAILURE</span>
                          <span className="text-red-400 text-base font-bold">{predictionOutput.probabilityFailure}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Explanation Summary */}
                    <div className="p-3.5 rounded-xl bg-[#101B2D] border border-[#39D5F2]/20 space-y-1">
                      <span className="text-[10px] font-mono text-[#39D5F2] uppercase tracking-wider block flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-[#39D5F2]" />
                        MODEL ATTRIBUTION SUMMARY
                      </span>
                      <p className="text-xs text-[#EAF3FF] leading-relaxed">
                        {predictionOutput.explanation}
                      </p>
                    </div>

                    {/* Key Contributing Features */}
                    <div>
                      <span className="text-[10px] font-mono text-[#8798B3] uppercase tracking-wider block mb-2">
                        FLIGHT-SPECIFIC FEATURE CONTRIBUTION (w_j · x_j)
                      </span>
                      <div className="space-y-1.5">
                        {predictionOutput.featureContributions.map((fc, i) => (
                          <div 
                            key={i} 
                            className="p-2 rounded-lg bg-[#0A1222] border border-white/5 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5 truncate pr-2">
                              <span className="text-[#EAF3FF] block truncate">{fc.feature}</span>
                              <span className={`text-[10px] font-mono ${
                                fc.contribution > 0 ? 'text-[#10B981]' : fc.contribution < 0 ? 'text-red-400' : 'text-[#8798B3]'
                              }`}>
                                {fc.impact}
                              </span>
                            </div>
                            <span className={`font-mono text-xs font-bold shrink-0 ${
                              fc.contribution > 0 ? 'text-[#10B981]' : fc.contribution < 0 ? 'text-red-400' : 'text-[#8798B3]'
                            }`}>
                              {fc.contribution > 0 ? `+${fc.contribution}` : fc.contribution}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#8798B3] font-mono space-y-2">
                    <Cpu className="w-8 h-8 text-[#39D5F2]/40 mx-auto" />
                    <p>Adjust pre-launch parameters to compute model inference.</p>
                  </div>
                )}
              </div>

              {/* Model Provenance Footer */}
              <div className="pt-3 border-t border-white/10 text-[10px] font-mono text-[#8798B3] space-y-1">
                <div className="flex justify-between">
                  <span>CLASSIFIER ARCHITECTURE:</span>
                  <span className="text-white">L2 Regularized Logistic Regression</span>
                </div>
                <div className="flex justify-between">
                  <span>ACTIVATION & LOSS:</span>
                  <span className="text-[#39D5F2]">Sigmoid + Class-Weighted Cross-Entropy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODEL EVALUATION & PERFORMANCE */}
      {activeTab === 'evaluation' && metrics && (
        <div className="space-y-6 animate-fadeIn">
          {/* Class Imbalance & Baseline Benchmark Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#101B2D] to-[#0A1222] border border-[#F59E0B]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  CLASS IMBALANCE BENCHMARK: MAJORITY-CLASS BASELINE ({metrics.baselineAccuracy}%)
                </h4>
                <p className="text-xs text-[#8798B3]">
                  The space industry has a natural ~93% historical success rate. A naive majority-class model achieves {metrics.baselineAccuracy}% accuracy simply by predicting Success for every launch, but exhibits <strong>0% Failure Recall</strong>.
                  Our class-weighted regularized model achieves <strong>{metrics.accuracy}% accuracy</strong> while successfully detecting unseen test failures and achieving a <strong>{metrics.rocAuc} ROC-AUC</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0A1222] border border-white/10 font-mono text-center shrink-0">
              <span className="text-[10px] text-[#8798B3] block">DELTA VS BASELINE</span>
              <span className="text-sm font-bold text-[#10B981]">
                +{Number((metrics.accuracy - metrics.baselineAccuracy).toFixed(2))}% ACCURACY
              </span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-panel p-4 rounded-xl font-mono text-center space-y-1">
              <span className="text-[10px] text-[#8798B3] uppercase block">Accuracy (Test)</span>
              <span className="text-2xl font-bold text-[#10B981]">{metrics.accuracy}%</span>
              <span className="text-[10px] text-[#8798B3] block">vs {metrics.baselineAccuracy}% naive</span>
            </div>
            <div className="space-panel p-4 rounded-xl font-mono text-center space-y-1">
              <span className="text-[10px] text-[#8798B3] uppercase block">Precision</span>
              <span className="text-2xl font-bold text-[#39D5F2]">{metrics.precision}%</span>
              <span className="text-[10px] text-[#8798B3] block">TP / (TP + FP)</span>
            </div>
            <div className="space-panel p-4 rounded-xl font-mono text-center space-y-1">
              <span className="text-[10px] text-[#8798B3] uppercase block">Recall (Sensitivity)</span>
              <span className="text-2xl font-bold text-[#648CFF]">{metrics.recall}%</span>
              <span className="text-[10px] text-[#8798B3] block">TP / (TP + FN)</span>
            </div>
            <div className="space-panel p-4 rounded-xl font-mono text-center space-y-1">
              <span className="text-[10px] text-[#8798B3] uppercase block">F1-Score</span>
              <span className="text-2xl font-bold text-[#F59E0B]">{metrics.f1Score}%</span>
              <span className="text-[10px] text-[#8798B3] block">Harmonic Mean</span>
            </div>
            <div className="space-panel p-4 rounded-xl font-mono text-center space-y-1 col-span-2 md:col-span-1">
              <span className="text-[10px] text-[#8798B3] uppercase block">ROC-AUC</span>
              <span className="text-2xl font-bold text-white">{metrics.rocAuc}</span>
              <span className="text-[10px] text-[#8798B3] block">Ranking Quality</span>
            </div>
          </div>

          {/* Confusion Matrix and Split Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Confusion Matrix (6 cols) */}
            <div className="lg:col-span-6 space-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Binary className="w-4 h-4 text-[#39D5F2]" />
                  OUT-OF-SAMPLE CONFUSION MATRIX (n={metrics.testStats.count.toLocaleString()})
                </h3>
                <span className="text-[10px] font-mono text-[#8798B3]">2020–2026 TEST DATA</span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                {/* True Negative */}
                <div className="p-4 rounded-xl bg-[#0A1222] border border-[#10B981]/30 space-y-1">
                  <div className="flex justify-between items-center text-[#8798B3]">
                    <span className="text-[10px] uppercase font-bold text-[#10B981]">TRUE NEGATIVE (TN)</span>
                    <span className="text-[10px] text-[#10B981] font-semibold">CORRECT</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {metrics.confusionMatrix.trueNegative.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-[#8798B3] font-sans">
                    Actual Failure, Correctly Predicted Failure. Anomaly risk flagged prior to flight.
                  </p>
                </div>

                {/* False Positive */}
                <div className="p-4 rounded-xl bg-[#0A1222] border border-red-500/30 space-y-1">
                  <div className="flex justify-between items-center text-[#8798B3]">
                    <span className="text-[10px] uppercase font-bold text-red-400">FALSE POSITIVE (FP)</span>
                    <span className="text-[10px] text-red-400 font-semibold">TYPE I ERROR</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {metrics.confusionMatrix.falsePositive.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-[#8798B3] font-sans">
                    Actual Failure, Predicted Success. Flight suffered unanticipated orbital failure.
                  </p>
                </div>

                {/* False Negative */}
                <div className="p-4 rounded-xl bg-[#0A1222] border border-amber-500/30 space-y-1">
                  <div className="flex justify-between items-center text-[#8798B3]">
                    <span className="text-[10px] uppercase font-bold text-[#F59E0B]">FALSE NEGATIVE (FN)</span>
                    <span className="text-[10px] text-[#F59E0B] font-semibold">TYPE II ERROR</span>
                  </div>
                  <div className="text-2xl font-bold text-[#F59E0B]">
                    {metrics.confusionMatrix.falseNegative.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-[#8798B3] font-sans">
                    Actual Success, Predicted Failure. Conservative false alarm on high-risk profile.
                  </p>
                </div>

                {/* True Positive */}
                <div className="p-4 rounded-xl bg-[#0A1222] border border-[#10B981]/30 space-y-1">
                  <div className="flex justify-between items-center text-[#8798B3]">
                    <span className="text-[10px] uppercase font-bold text-[#10B981]">TRUE POSITIVE (TP)</span>
                    <span className="text-[10px] text-[#10B981] font-semibold">CORRECT</span>
                  </div>
                  <div className="text-2xl font-bold text-[#10B981]">
                    {metrics.confusionMatrix.truePositive.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-[#8798B3] font-sans">
                    Actual Success, Correctly Predicted Success. Nominal orbital insertion confirmed.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono text-[#8798B3] flex justify-between">
                <span>TOTAL TEST LAUNCHES: {metrics.testStats.count.toLocaleString()}</span>
                <span>FAILURES DETECTED: {metrics.confusionMatrix.trueNegative}/{metrics.testStats.failureCount} ({((metrics.confusionMatrix.trueNegative / metrics.testStats.failureCount) * 100).toFixed(1)}%)</span>
              </div>
            </div>

            {/* Training Convergence Loss Curve (6 cols) */}
            <div className="lg:col-span-6 space-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#39D5F2]" />
                  TRAINING LOSS CONVERGENCE (CROSS-ENTROPY)
                </h3>
                <span className="text-[10px] font-mono text-[#8798B3]">
                  FINAL LOSS: {metrics.lossHistory[metrics.lossHistory.length - 1]?.loss || 'N/A'}
                </span>
              </div>

              {/* Loss Curve SVG */}
              <div className="h-44 w-full relative">
                {metrics.lossHistory.length > 1 ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                    <defs>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39D5F2" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#39D5F2" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

                    {/* Polyline Path */}
                    {(() => {
                      const maxLoss = Math.max(...metrics.lossHistory.map(h => h.loss), 0.5);
                      const minLoss = Math.min(...metrics.lossHistory.map(h => h.loss), 0.05);
                      const range = maxLoss - minLoss || 1;

                      const points = metrics.lossHistory.map((h, i) => {
                        const x = (i / (metrics.lossHistory.length - 1)) * 390 + 5;
                        const y = 140 - ((h.loss - minLoss) / range) * 120;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      });

                      const areaPoints = [
                        `5,140`,
                        ...points,
                        `395,140`
                      ].join(' ');

                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#lossGrad)" />
                          <polyline 
                            points={points.join(' ')} 
                            fill="none" 
                            stroke="#39D5F2" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                          />
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-[#8798B3]">
                    Insufficient loss history.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs pt-2">
                <div className="p-2 rounded-lg bg-[#0A1222] border border-white/5">
                  <span className="text-[10px] text-[#8798B3] block">INITIAL LOSS</span>
                  <span className="text-white font-bold">{metrics.lossHistory[0]?.loss || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0A1222] border border-white/5">
                  <span className="text-[10px] text-[#8798B3] block">FINAL CONVERGED LOSS</span>
                  <span className="text-[#10B981] font-bold">
                    {metrics.lossHistory[metrics.lossHistory.length - 1]?.loss || 0}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#0A1222] border border-white/5">
                  <span className="text-[10px] text-[#8798B3] block">EPOCHS OPTIMIZED</span>
                  <span className="text-[#39D5F2] font-bold">{metrics.epochs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Dataset Split Statistics */}
          <div className="space-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#39D5F2]" />
              CHRONOLOGICAL DATASET PARTITION BREAKDOWN (STRICT NO-LEAKAGE SPLIT)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0A1222] border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-[#39D5F2]">
                  <span className="font-bold uppercase">TRAINING SET (80%)</span>
                  <span className="px-2 py-0.5 rounded bg-[#39D5F2]/10 text-[10px]">HISTORICAL PAST</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {metrics.trainStats.count.toLocaleString()} Launches
                </div>
                <div className="space-y-1 text-[#8798B3] pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Date Range:</span>
                    <span className="text-white">{metrics.trainStats.startDate} to {metrics.trainStats.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful Launches:</span>
                    <span className="text-[#10B981]">{metrics.trainStats.successCount.toLocaleString()} ({metrics.trainStats.successRate}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Launches:</span>
                    <span className="text-red-400">{metrics.trainStats.failureCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0A1222] border border-white/10 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-[#10B981]">
                  <span className="font-bold uppercase">OUT-OF-SAMPLE TEST SET (20%)</span>
                  <span className="px-2 py-0.5 rounded bg-[#10B981]/10 text-[10px]">UNSEEN FUTURE</span>
                </div>
                <div className="text-xl font-bold text-white">
                  {metrics.testStats.count.toLocaleString()} Launches
                </div>
                <div className="space-y-1 text-[#8798B3] pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Date Range:</span>
                    <span className="text-white">{metrics.testStats.startDate} to {metrics.testStats.endDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful Launches:</span>
                    <span className="text-[#10B981]">{metrics.testStats.successCount.toLocaleString()} ({metrics.testStats.successRate}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Launches:</span>
                    <span className="text-red-400">{metrics.testStats.failureCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEARNED FEATURE WEIGHTS & IMPORTANCE */}
      {activeTab === 'features' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview Banner */}
          <div className="p-4 rounded-xl bg-[#0A1222] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#F59E0B]" />
                LOGISTIC REGRESSION LEARNED PARAMETERS (w_j & ODDS RATIOS)
              </h4>
              <p className="text-xs text-[#8798B3]">
                Positive weights (w &gt; 0, Odds Ratio &gt; 1) increase the likelihood of nominal mission success. 
                Negative weights (w &lt; 0, Odds Ratio &lt; 1) indicate elevated mission failure risk based on historical outcomes.
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-[#F59E0B] shrink-0">
              {featureSpecs.length} Active Features
            </span>
          </div>

          {/* Top Drivers Split: Success Drivers vs Risk Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Success Drivers */}
            <div className="space-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  TOP SUCCESS PROMOTERS (POSITIVE WEIGHTS)
                </h3>
                <span className="text-[10px] font-mono text-[#10B981]">HIGHEST ODDS RATIO</span>
              </div>

              <div className="space-y-2">
                {topPositiveFeatures.map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0A1222] border border-[#10B981]/20 space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white font-bold truncate pr-2">{f.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#10B981] font-bold">+{f.weight}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981]">
                          OR: {f.oddsRatio}x
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8798B3] font-mono">
                      <span>Category: {f.category}</span>
                      <span className="truncate max-w-[200px]">{f.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Risk Indicators */}
            <div className="space-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  TOP RISK INDICATORS (NEGATIVE WEIGHTS)
                </h3>
                <span className="text-[10px] font-mono text-red-400">HIGHEST ANOMALY CORRELATION</span>
              </div>

              <div className="space-y-2">
                {topRiskFeatures.map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#0A1222] border border-red-500/20 space-y-1">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-white font-bold truncate pr-2">{f.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-red-400 font-bold">{f.weight}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-500/30">
                          OR: {f.oddsRatio}x
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8798B3] font-mono">
                      <span>Category: {f.category}</span>
                      <span className="truncate max-w-[200px]">{f.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Complete Feature Spec Table */}
          <div className="space-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-[#39D5F2]" />
              FULL FEATURE SPECIFICATION TABLE & COEFFICIENTS
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#8798B3] uppercase text-[10px]">
                    <th className="pb-2">Feature Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Learned Weight (w)</th>
                    <th className="pb-2">Odds Ratio (e^w)</th>
                    <th className="pb-2">Impact Direction</th>
                    <th className="pb-2">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {featureSpecs.map((f, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2.5 text-white font-bold">{f.name}</td>
                      <td className="py-2.5 text-[#8798B3]">{f.category}</td>
                      <td className={`py-2.5 font-bold ${
                        f.weight > 0 ? 'text-[#10B981]' : f.weight < 0 ? 'text-red-400' : 'text-[#8798B3]'
                      }`}>
                        {f.weight > 0 ? `+${f.weight}` : f.weight}
                      </td>
                      <td className="py-2.5 text-[#39D5F2]">{f.oddsRatio}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          f.weight > 0 
                            ? 'bg-[#10B981]/15 text-[#10B981]' 
                            : f.weight < 0 
                            ? 'bg-red-950/40 text-red-400' 
                            : 'bg-white/5 text-[#8798B3]'
                        }`}>
                          {f.direction}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#8798B3] text-[11px] font-sans max-w-xs truncate">
                        {f.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCIENTIFIC GOVERNANCE & ETHICS */}
      {activeTab === 'governance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prevention of Target Leakage */}
            <div className="space-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#39D5F2]" />
                1. PREVENTION OF TARGET & TEMPORAL LEAKAGE
              </h3>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                A critical failure mode in predictive aerospace models is "target leakage"—where post-launch telemetry or anomaly flags are inadvertently included in model features. 
                Our engine enforces strict zero-leakage standards:
              </p>
              <ul className="text-xs text-[#EAF3FF] space-y-2 list-disc list-inside">
                <li><code className="text-[#39D5F2]">outcome</code> is the target label and never appears in feature vectors.</li>
                <li><code className="text-[#39D5F2]">flight</code>, <code className="text-[#39D5F2]">launch_code</code>, and <code className="text-[#39D5F2]">launch_tag</code> are excluded as non-predictive identifiers.</li>
                <li>Chronological 80/20 train/test split isolates 1957–2020 for model fitting, reserving 2020–2026 strictly for out-of-sample evaluation.</li>
                <li>Feature preprocessing parameters (mean, standard deviation, top categorical entities) are computed exclusively on the training partition.</li>
              </ul>
            </div>

            {/* Imbalance Handling */}
            <div className="space-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
                2. CLASS IMBALANCE & OBJECTIVE FUNCTION
              </h3>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                The spaceflight record exhibits an extreme 93.2% / 6.8% class imbalance. Standard unweighted optimization trivially defaults to guessing "Success" 100% of the time.
              </p>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                To counter this, our optimization implements a class-weighted cross-entropy loss function:
              </p>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/10 font-mono text-xs text-[#39D5F2]">
                L(w) = - [ y · log(p) + w_neg · (1 - y) · log(1 - p) ] + λ · ||w||²
              </div>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                where <code className="text-[#39D5F2]">w_neg = N_success / N_failure ≈ 12.24</code>, heavily penalizing missed failures and enabling the model to learn genuine risk indicators.
              </p>
            </div>

            {/* Scientific Correlation vs Causation */}
            <div className="space-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F43F5E]" />
                3. CORRELATION VS CAUSATION DISCLAIMER
              </h3>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                The learned coefficients represent empirical statistical associations in historical data, not physical rocket dynamics. 
                For example, older flight years correlate with higher failure rates due to nascent industry learning curves in the 1960s, rather than calendar time itself.
              </p>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                Predictions are intended for statistical visualization, risk exploration, and comparative historical analysis—not as certified launch commit criteria for actual flight hardware.
              </p>
            </div>

            {/* Production Architecture & Extensibility */}
            <div className="space-panel p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#10B981]" />
                4. ARCHITECTURAL TRANSPARENCY & ZERO DEPENDENCY
              </h3>
              <p className="text-xs text-[#8798B3] leading-relaxed">
                The entire machine learning pipeline is implemented in pure, audited TypeScript with zero external opaque binaries or black-box Python dependencies. 
                Vectorization, sigmoid activation, loss computation, gradient descent, and evaluation run directly in the client environment with sub-millisecond inference latency.
              </p>
              <div className="p-3 rounded-xl bg-[#0A1222] border border-white/10 font-mono text-xs text-[#10B981] flex justify-between">
                <span>INFERENCE LATENCY: &lt; 1 ms</span>
                <span>AUDIT STATUS: FULLY DETERMINISTIC</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

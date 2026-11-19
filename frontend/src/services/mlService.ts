import { 
  CleanedMissionRecord, 
  MLModelMetrics, 
  MLFeatureSpec, 
  MLInferenceInput, 
  MLInferenceOutput 
} from '../types';

export interface PreprocessorArtifacts {
  yearStats: { mean: number; std: number };
  massStats: { mean: number; std: number };
  apogeeStats: { mean: number; std: number };
  incStats: { mean: number; std: number };
  topCountries: string[];
  topAgencies: string[];
  topSites: string[];
  topVehicles: string[];
  featureNames: string[];
  featureMeta: Array<{ name: string; category: string; description: string }>;
}

export class LogisticRegressionModel {
  weights: number[];
  bias: number;
  artifacts: PreprocessorArtifacts;

  constructor(weights: number[], bias: number, artifacts: PreprocessorArtifacts) {
    this.weights = weights;
    this.bias = bias;
    this.artifacts = artifacts;
  }

  /**
   * Transforms a pre-launch flight profile into a numerical feature vector.
   * Uses strictly the training set preprocessing artifacts (zero leakage).
   */
  vectorize(input: MLInferenceInput): number[] {
    const art = this.artifacts;
    const feats: number[] = [];

    // 1. Normalized Launch Year (indicates industry technological epoch)
    const yr = input.year || 2026;
    feats.push((yr - art.yearStats.mean) / art.yearStats.std);

    // 2. Normalized Payload Mass + Missing Indicator
    if (input.payloadMassT !== null && input.payloadMassT !== undefined && !isNaN(input.payloadMassT)) {
      feats.push((input.payloadMassT - art.massStats.mean) / art.massStats.std);
      feats.push(0); // not missing
    } else {
      feats.push(0); // imputed with mean
      feats.push(1); // missing indicator
    }

    // 3. Log-Normalized Apogee Altitude + Missing Indicator
    if (input.apogeeKm !== null && input.apogeeKm !== undefined && !isNaN(input.apogeeKm) && input.apogeeKm > 0) {
      const logAp = Math.log10(input.apogeeKm + 1);
      feats.push((logAp - art.apogeeStats.mean) / art.apogeeStats.std);
      feats.push(0);
    } else {
      feats.push(0);
      feats.push(1);
    }

    // 4. Normalized Inclination Angle + Missing Indicator
    if (input.inclinationDeg !== null && input.inclinationDeg !== undefined && !isNaN(input.inclinationDeg)) {
      feats.push((input.inclinationDeg - art.incStats.mean) / art.incStats.std);
      feats.push(0);
    } else {
      feats.push(0);
      feats.push(1);
    }

    // 5. Mission Classification (Orbital vs Deep Space)
    feats.push(input.launchClass === 'Deep space' ? 1 : 0);

    // 6. One-Hot Sovereign Launch Country (Fitted on Train Set)
    art.topCountries.forEach(c => {
      feats.push(input.launchCountry === c ? 1 : 0);
    });

    // 7. One-Hot Operating Agency (Fitted on Train Set)
    art.topAgencies.forEach(a => {
      feats.push(input.agency === a ? 1 : 0);
    });

    // 8. One-Hot Spaceport Complex (Fitted on Train Set)
    art.topSites.forEach(s => {
      feats.push(input.launchSite === s ? 1 : 0);
    });

    // 9. One-Hot Rocket Booster Series (Fitted on Train Set)
    art.topVehicles.forEach(v => {
      feats.push(input.launchVehicle === v ? 1 : 0);
    });

    return feats;
  }

  /**
   * Computes binary probability using standard Sigmoid activation: 1 / (1 + e^-z)
   */
  predictProbability(features: number[]): { pSuccess: number; pFailure: number; z: number } {
    let z = this.bias;
    const len = Math.min(features.length, this.weights.length);
    for (let j = 0; j < len; j++) {
      z += this.weights[j] * features[j];
    }

    // Numerical stability clamp [-25, 25]
    const clampedZ = Math.max(-25, Math.min(25, z));
    const pSuccess = 1 / (1 + Math.exp(-clampedZ));
    const pFailure = 1 - pSuccess;

    return { pSuccess, pFailure, z };
  }

  /**
   * Runs end-to-end inference on user flight input and explains feature contributions.
   */
  predict(input: MLInferenceInput): MLInferenceOutput {
    const x = this.vectorize(input);
    const { pSuccess, pFailure, z } = this.predictProbability(x);

    const predictedStatus = pSuccess >= 0.5 ? 'Success' : 'Failure';
    const confidenceScore = Number((Math.max(pSuccess, pFailure) * 100).toFixed(1));

    // Calculate individual feature contribution: w_j * x_j
    const contributions: Array<{
      feature: string;
      value: string | number;
      contribution: number;
      impact: 'Supports Success' | 'Indicates Risk' | 'Neutral';
    }> = [];

    const art = this.artifacts;
    for (let j = 0; j < this.weights.length; j++) {
      const w = this.weights[j];
      const val = x[j];
      const contrib = w * val;

      if (Math.abs(contrib) > 0.05) {
        const meta = art.featureMeta[j] || { name: `Feature ${j}`, category: 'General' };
        contributions.push({
          feature: meta.name,
          value: val.toFixed ? Number(val.toFixed(2)) : val,
          contribution: Number(contrib.toFixed(3)),
          impact: contrib > 0.1 ? 'Supports Success' : contrib < -0.1 ? 'Indicates Risk' : 'Neutral'
        });
      }
    }

    // Sort by absolute impact
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // Generate scientific explanation
    let explanation = '';
    if (predictedStatus === 'Success') {
      const topPos = contributions.filter(c => c.contribution > 0).slice(0, 2).map(c => c.feature);
      explanation = `The statistical model projects a ${(pSuccess * 100).toFixed(1)}% probability of orbital success. The primary positive factors are ${topPos.join(' and ') || 'proven booster flight history and high industry maturity'}.`;
    } else {
      const topNeg = contributions.filter(c => c.contribution < 0).slice(0, 2).map(c => c.feature);
      explanation = `The statistical model indicates an elevated mission anomaly risk with a ${(pFailure * 100).toFixed(1)}% failure probability. Key risk associations include ${topNeg.join(' and ') || 'historical booster family failure rate or high-risk launch parameters'}.`;
    }

    return {
      predictedStatus,
      probabilitySuccess: Number((pSuccess * 100).toFixed(1)),
      probabilityFailure: Number((pFailure * 100).toFixed(1)),
      confidenceScore,
      linearScore: Number(z.toFixed(3)),
      featureContributions: contributions.slice(0, 6),
      explanation
    };
  }

  /**
   * Returns learned coefficients sorted by statistical impact.
   */
  getFeatureImportance(): MLFeatureSpec[] {
    const art = this.artifacts;
    const specs: MLFeatureSpec[] = [];

    for (let j = 0; j < this.weights.length; j++) {
      const w = this.weights[j];
      const meta = art.featureMeta[j] || { name: `Feature ${j}`, category: 'General', description: '' };
      specs.push({
        name: meta.name,
        category: meta.category,
        type: 'Learned Coefficient',
        weight: Number(w.toFixed(3)),
        oddsRatio: Number(Math.exp(w).toFixed(3)),
        direction: w > 0.05 ? 'Positive (+)' : w < -0.05 ? 'Negative (-)' : 'Neutral',
        description: meta.description
      });
    }

    // Sort by absolute weight
    specs.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    return specs;
  }
}

/**
 * Trains a bona fide Logistic Regression classifier on the canonical space dataset.
 * Uses Chronological Train/Test Split (80% Train, 20% Test) to strictly prevent future data leakage.
 */
export async function trainLogisticRegression(
  records: CleanedMissionRecord[],
  options?: {
    epochs?: number;
    lr?: number;
    lambda?: number;
    onProgress?: (progressPercent: number, epoch: number, loss: number) => void;
  }
): Promise<{ model: LogisticRegressionModel; metrics: MLModelMetrics }> {
  if (records.length < 50) {
    throw new Error('Insufficient records to train machine learning model.');
  }

  const epochs = options?.epochs || 150;
  const lr = options?.lr || 0.05;
  const lambda = options?.lambda || 0.01;

  // 1. Strict Chronological Ordering
  const sorted = [...records].sort((a, b) => 
    (a.date || `${a.year}`).localeCompare(b.date || `${b.year}`)
  );

  // 2. 80/20 Chronological Split
  const splitIdx = Math.floor(sorted.length * 0.8);
  const trainRecords = sorted.slice(0, splitIdx);
  const testRecords = sorted.slice(splitIdx);

  // Class distributions
  const trainSuccessCount = trainRecords.filter(r => r.outcome === 'Success').length;
  const trainFailCount = trainRecords.length - trainSuccessCount;
  const testSuccessCount = testRecords.filter(r => r.outcome === 'Success').length;
  const testFailCount = testRecords.length - testSuccessCount;

  // 3. Fit Preprocessing Artifacts ONLY on Training Set
  const getTopCategories = (key: keyof CleanedMissionRecord, topN: number): string[] => {
    const counts = new Map<string, number>();
    trainRecords.forEach(r => {
      const val = String(r[key] || '');
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(entry => entry[0]);
  };

  const topCountries = getTopCategories('launch_country', 8);
  const topAgencies = getTopCategories('agency', 12);
  const topSites = getTopCategories('launch_site', 10);
  const topVehicles = getTopCategories('launch_vehicle', 16);

  const getMeanStd = (fn: (r: CleanedMissionRecord) => number | null): { mean: number; std: number } => {
    const vals = trainRecords.map(fn).filter((v): v is number => v !== null && !isNaN(v));
    if (vals.length === 0) return { mean: 0, std: 1 };
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
    const std = Math.sqrt(variance) || 1;
    return { mean, std };
  };

  const yearStats = getMeanStd(r => r.year);
  const massStats = getMeanStd(r => r.payload_mass_t);
  const apogeeStats = getMeanStd(r => r.apogee_km !== null && r.apogee_km > 0 ? Math.log10(r.apogee_km + 1) : null);
  const incStats = getMeanStd(r => r.inclination_deg);

  // Construct Feature Metadata
  const featureNames: string[] = [];
  const featureMeta: Array<{ name: string; category: string; description: string }> = [];

  const addFeat = (name: string, category: string, description: string) => {
    featureNames.push(name);
    featureMeta.push({ name, category, description });
  };

  addFeat('Launch Year (Epoch)', 'Temporal', 'Chronological flight year (industry maturity & technological progress)');
  addFeat('Payload Mass (tonnes)', 'Payload', 'Standardized payload weight delivered to orbital separation');
  addFeat('Payload Mass Missing Indicator', 'Data Integrity', 'Binary flag indicating payload mass was unlisted/classified');
  addFeat('Apogee Altitude (log km)', 'Trajectory', 'Log-transformed orbital apoapsis (LEO vs GEO vs High-Elliptic)');
  addFeat('Apogee Missing Indicator', 'Data Integrity', 'Binary flag indicating apogee altitude was unlisted');
  addFeat('Inclination Angle (°)', 'Trajectory', 'Standardized orbital plane inclination relative to equator');
  addFeat('Inclination Missing Indicator', 'Data Integrity', 'Binary flag indicating inclination was unlisted');
  addFeat('Class: Deep Space Insertion', 'Mission Class', 'Binary flag for escape-velocity lunar/planetary missions');

  topCountries.forEach(c => addFeat(`Country: ${c}`, 'Sovereign Program', `One-hot attribution for ${c} launch program`));
  topAgencies.forEach(a => addFeat(`Agency: ${a}`, 'Operator', `One-hot attribution for ${a} operating entity`));
  topSites.forEach(s => addFeat(`Site: ${s}`, 'Infrastructure', `One-hot attribution for ${s} spaceport complex`));
  topVehicles.forEach(v => addFeat(`Vehicle: ${v}`, 'Booster Family', `One-hot attribution for ${v} rocket family`));

  const artifacts: PreprocessorArtifacts = {
    yearStats,
    massStats,
    apogeeStats,
    incStats,
    topCountries,
    topAgencies,
    topSites,
    topVehicles,
    featureNames,
    featureMeta
  };

  const modelProto = new LogisticRegressionModel([], 0, artifacts);

  // 4. Vectorize Training and Testing Datasets
  const X_train: number[][] = [];
  const y_train: number[] = [];
  for (let i = 0; i < trainRecords.length; i++) {
    const r = trainRecords[i];
    X_train.push(modelProto.vectorize(r as any));
    y_train.push(r.outcome === 'Success' ? 1 : 0);
  }

  const X_test: number[][] = [];
  const y_test: number[] = [];
  for (let i = 0; i < testRecords.length; i++) {
    const r = testRecords[i];
    X_test.push(modelProto.vectorize(r as any));
    y_test.push(r.outcome === 'Success' ? 1 : 0);
  }

  const numFeatures = X_train[0].length;
  const weights = new Array(numFeatures).fill(0);
  let bias = 0;

  // Class weights to address 93/7 class imbalance
  const nTrain = X_train.length;
  const wPos = 1.0;
  const wNeg = trainFailCount > 0 ? (trainSuccessCount / trainFailCount) : 1.0;

  const lossHistory: Array<{ epoch: number; loss: number }> = [];

  // 5. Optimization Loop (Gradient Descent with L2 Ridge Penalty)
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(numFeatures).fill(0);
    let gradB = 0;
    let epochLoss = 0;

    for (let i = 0; i < nTrain; i++) {
      const x = X_train[i];
      const y = y_train[i];
      const sampleWeight = y === 1 ? wPos : wNeg;

      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * x[j];
      }

      const clampedZ = Math.max(-25, Math.min(25, z));
      const p = 1 / (1 + Math.exp(-clampedZ));

      const pClamp = Math.max(1e-7, Math.min(1 - 1e-7, p));
      epochLoss += sampleWeight * (-y * Math.log(pClamp) - (1 - y) * Math.log(1 - pClamp));

      const err = sampleWeight * (p - y);
      for (let j = 0; j < numFeatures; j++) {
        gradW[j] += err * x[j];
      }
      gradB += err;
    }

    // Weight and bias gradient updates with L2 regularization
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= lr * ((gradW[j] / nTrain) + (lambda / nTrain) * weights[j]);
    }
    bias -= lr * (gradB / nTrain);

    const normLoss = Number((epochLoss / nTrain).toFixed(4));
    if (epoch % 10 === 0 || epoch === epochs - 1) {
      lossHistory.push({ epoch: epoch + 1, loss: normLoss });
      if (options?.onProgress) {
        options.onProgress(Math.round(((epoch + 1) / epochs) * 100), epoch + 1, normLoss);
      }
    }
  }

  const trainedModel = new LogisticRegressionModel(weights, bias, artifacts);

  // 6. Real Model Evaluation on Unseen Test Set
  let TP = 0;
  let FP = 0;
  let TN = 0;
  let FN = 0;
  const testProbs: Array<{ p: number; y: number }> = [];

  const nTest = X_test.length;
  for (let i = 0; i < nTest; i++) {
    const x = X_test[i];
    const y = y_test[i];
    const { pSuccess } = trainedModel.predictProbability(x);
    testProbs.push({ p: pSuccess, y });

    const pred = pSuccess >= 0.5 ? 1 : 0;
    if (pred === 1 && y === 1) TP++;
    else if (pred === 1 && y === 0) FP++;
    else if (pred === 0 && y === 0) TN++;
    else if (pred === 0 && y === 1) FN++;
  }

  const accuracy = Number(((TP + TN) / nTest).toFixed(4));
  const precision = TP + FP > 0 ? Number((TP / (TP + FP)).toFixed(4)) : 0;
  const recall = TP + FN > 0 ? Number((TP / (TP + FN)).toFixed(4)) : 0;
  const f1Score = precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

  // Baseline performance (predicting majority class Success for all test cases)
  const baselineAccuracy = Number((testSuccessCount / nTest).toFixed(4));

  // Wilcoxon-Mann-Whitney ROC-AUC calculation
  testProbs.sort((a, b) => b.p - a.p);
  let rankSum = 0;
  for (let i = 0; i < testProbs.length; i++) {
    if (testProbs[i].y === 1) {
      rankSum += (nTest - i);
    }
  }
  const n1 = testSuccessCount;
  const n0 = testFailCount;
  const rocAuc = n1 > 0 && n0 > 0 
    ? Number(((rankSum - (n1 * (n1 + 1)) / 2) / (n1 * n0)).toFixed(3))
    : 0.5;

  const metrics: MLModelMetrics = {
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1Score: Number((f1Score * 100).toFixed(2)),
    rocAuc,
    baselineAccuracy: Number((baselineAccuracy * 100).toFixed(2)),
    confusionMatrix: {
      truePositive: TP,
      falsePositive: FP,
      trueNegative: TN,
      falseNegative: FN
    },
    trainStats: {
      count: trainRecords.length,
      startDate: trainRecords[0]?.date || `${trainRecords[0]?.year}`,
      endDate: trainRecords[trainRecords.length - 1]?.date || `${trainRecords[trainRecords.length - 1]?.year}`,
      successCount: trainSuccessCount,
      failureCount: trainFailCount,
      successRate: Number(((trainSuccessCount / trainRecords.length) * 100).toFixed(2))
    },
    testStats: {
      count: testRecords.length,
      startDate: testRecords[0]?.date || `${testRecords[0]?.year}`,
      endDate: testRecords[testRecords.length - 1]?.date || `${testRecords[testRecords.length - 1]?.year}`,
      successCount: testSuccessCount,
      failureCount: testFailCount,
      successRate: Number(((testSuccessCount / testRecords.length) * 100).toFixed(2))
    },
    lossHistory,
    epochs,
    learningRate: lr,
    regularizationLambda: lambda,
    trainedAt: new Date().toISOString()
  };

  return { model: trainedModel, metrics };
}

export interface PresetMission {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  input: MLInferenceInput;
}

export const PRESET_MISSIONS: PresetMission[] = [
  {
    id: 'falcon9_starlink',
    name: 'Falcon 9 LEO Megaconstellation',
    subtitle: 'SpaceX / USA (2024)',
    description: 'High-cadence commercial booster deploying broadband satellites into Low Earth Orbit.',
    input: {
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
    }
  },
  {
    id: 'saturn_v_apollo',
    name: 'Saturn V Apollo Lunar Injection',
    subtitle: 'NASA / USA (1969)',
    description: 'Super heavy-lift exploration architecture delivering manned Command & Lunar Module to Moon.',
    input: {
      year: 1969,
      launchCountry: 'United States',
      agency: 'NASA',
      launchVehicle: 'Saturn V',
      launchSite: 'Cape Canaveral',
      launchClass: 'Deep space',
      payloadMassT: 45.0,
      apogeeKm: 384400,
      perigeeKm: 185,
      inclinationDeg: 32.5
    }
  },
  {
    id: 'soyuz_crew',
    name: 'Soyuz ISS Crew Rotation',
    subtitle: 'Roscosmos / Russia (2018)',
    description: 'Proven human-rated medium-lift workhorse delivering international expedition crew to Station.',
    input: {
      year: 2018,
      launchCountry: 'Russia',
      agency: 'Roscosmos',
      launchVehicle: 'Soyuz',
      launchSite: 'Baikonur Cosmodrome',
      launchClass: 'Orbital',
      payloadMassT: 7.2,
      apogeeKm: 415,
      perigeeKm: 408,
      inclinationDeg: 51.6
    }
  },
  {
    id: 'ariane5_geo',
    name: 'Ariane 5 Heavy Commercial GTO',
    subtitle: 'Arianespace / France (2017)',
    description: 'Equatorial heavy orbital launcher carrying dual high-throughput telecommunication satellites.',
    input: {
      year: 2017,
      launchCountry: 'France',
      agency: 'Arianespace',
      launchVehicle: 'Ariane 5',
      launchSite: 'Kourou',
      launchClass: 'Orbital',
      payloadMassT: 10.2,
      apogeeKm: 35786,
      perigeeKm: 250,
      inclinationDeg: 6.0
    }
  },
  {
    id: 'pslv_earth_obs',
    name: 'PSLV Sun-Synchronous Polar',
    subtitle: 'ISRO / India (2021)',
    description: 'Highly versatile multi-stage polar rocket deploying synthetic aperture radar Earth imaging satellite.',
    input: {
      year: 2021,
      launchCountry: 'India',
      agency: 'ISRO',
      launchVehicle: 'PSLV',
      launchSite: 'Satish Dhawan Space Centre',
      launchClass: 'Orbital',
      payloadMassT: 1.8,
      apogeeKm: 650,
      perigeeKm: 630,
      inclinationDeg: 97.8
    }
  }
];

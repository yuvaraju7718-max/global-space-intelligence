const fs = require('fs');

function parseCSVToRows(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken);
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentToken);
      currentToken = '';
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }
  if (currentToken !== '' || row.length > 0) {
    row.push(currentToken);
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      lines.push(row);
    }
  }
  return lines;
}

const text = fs.readFileSync('frontend/public/data/global_space_missions_cleaned.csv', 'utf8');
const rows = parseCSVToRows(text);
const headers = rows[0].map(h => h.trim());

const records = [];
for (let i = 1; i < rows.length; i++) {
  records.push({
    launch_tag: rows[i][0].trim(),
    date: rows[i][1].trim(),
    year: parseInt(rows[i][3].trim(), 10) || 1957,
    launch_vehicle: rows[i][4].trim(),
    launch_site: rows[i][7].trim(),
    site_country: rows[i][9].trim(),
    agency: rows[i][10].trim(),
    launch_country: rows[i][11].trim(),
    launch_class: rows[i][12].trim() === 'Deep space' ? 'Deep space' : 'Orbital',
    outcome: rows[i][13].trim() === 'Failure' ? 'Failure' : 'Success',
    apogee_km: rows[i][15]?.trim() && !isNaN(rows[i][15]) ? parseFloat(rows[i][15]) : null,
    perigee_km: rows[i][16]?.trim() && !isNaN(rows[i][16]) ? parseFloat(rows[i][16]) : null,
    inclination_deg: rows[i][17]?.trim() && !isNaN(rows[i][17]) ? parseFloat(rows[i][17]) : null,
    payload_mass_t: rows[i][18]?.trim() && !isNaN(rows[i][18]) ? parseFloat(rows[i][18]) : null,
  });
}

// 1. Chronological Sort
records.sort((a,b) => (a.date || `${a.year}`).localeCompare(b.date || `${b.year}`));

// 2. 80/20 Chronological Split
const splitIdx = Math.floor(records.length * 0.8);
const trainSet = records.slice(0, splitIdx);
const testSet = records.slice(splitIdx);

console.log('Train count:', trainSet.length, 'Dates:', trainSet[0].date, 'to', trainSet[trainSet.length-1].date);
console.log('Test count:', testSet.length, 'Dates:', testSet[0].date, 'to', testSet[testSet.length-1].date);

const trainSuccess = trainSet.filter(r => r.outcome === 'Success').length;
const testSuccess = testSet.filter(r => r.outcome === 'Success').length;
console.log('Train Successes:', trainSuccess, 'Failures:', trainSet.length - trainSuccess, `(${(trainSuccess/trainSet.length*100).toFixed(1)}%)`);
console.log('Test Successes:', testSuccess, 'Failures:', testSet.length - testSuccess, `(${(testSuccess/testSet.length*100).toFixed(1)}%)`);

// 3. Feature Engineering & Preprocessing fitted on trainSet only
// Categorical vocabularies (top N)
function getTopCategories(recs, key, topN) {
  const counts = {};
  recs.forEach(r => { counts[r[key]] = (counts[r[key]] || 0) + 1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0, topN).map(x=>x[0]);
}

const topCountries = getTopCategories(trainSet, 'launch_country', 8);
const topAgencies = getTopCategories(trainSet, 'agency', 12);
const topSites = getTopCategories(trainSet, 'launch_site', 10);
const topVehicles = getTopCategories(trainSet, 'launch_vehicle', 15);

// Numerical stats fitted on trainSet only
function getNumericStats(recs, key) {
  const valid = recs.map(r => r[key]).filter(v => v !== null && !isNaN(v));
  const mean = valid.reduce((s,v)=>s+v,0) / valid.length;
  const std = Math.sqrt(valid.reduce((s,v)=>s + Math.pow(v - mean, 2), 0) / valid.length) || 1;
  return { mean, std };
}

const yearStats = getNumericStats(trainSet, 'year');
const massStats = getNumericStats(trainSet, 'payload_mass_t');
const apogeeStats = getNumericStats(trainSet, 'apogee_km');
const incStats = getNumericStats(trainSet, 'inclination_deg');

// Vectorizer
function vectorize(r) {
  const feats = [];

  // 1. Normalized Year
  feats.push((r.year - yearStats.mean) / yearStats.std);

  // 2. Normalized Payload Mass + Missing Indicator
  if (r.payload_mass_t !== null) {
    feats.push((r.payload_mass_t - massStats.mean) / massStats.std);
    feats.push(0);
  } else {
    feats.push(0);
    feats.push(1);
  }

  // 3. Normalized Apogee (log transformed) + Missing Indicator
  if (r.apogee_km !== null && r.apogee_km > 0) {
    feats.push((Math.log10(r.apogee_km + 1) - 3.2) / 1.5);
    feats.push(0);
  } else {
    feats.push(0);
    feats.push(1);
  }

  // 4. Normalized Inclination + Missing Indicator
  if (r.inclination_deg !== null) {
    feats.push((r.inclination_deg - incStats.mean) / incStats.std);
    feats.push(0);
  } else {
    feats.push(0);
    feats.push(1);
  }

  // 5. Launch Class: Orbital vs Deep space
  feats.push(r.launch_class === 'Deep space' ? 1 : 0);

  // 6. One-hot Countries
  topCountries.forEach(c => { feats.push(r.launch_country === c ? 1 : 0); });

  // 7. One-hot Agencies
  topAgencies.forEach(a => { feats.push(r.agency === a ? 1 : 0); });

  // 8. One-hot Sites
  topSites.forEach(s => { feats.push(r.launch_site === s ? 1 : 0); });

  // 9. One-hot Vehicles
  topVehicles.forEach(v => { feats.push(r.launch_vehicle === v ? 1 : 0); });

  return feats;
}

const X_train = trainSet.map(vectorize);
const y_train = trainSet.map(r => r.outcome === 'Success' ? 1 : 0);
const X_test = testSet.map(vectorize);
const y_test = testSet.map(r => r.outcome === 'Success' ? 1 : 0);

const numFeatures = X_train[0].length;
console.log('Feature vector dimension:', numFeatures);

// 4. Train Logistic Regression with L2 Regularization & Balanced Class Weights
const weights = new Array(numFeatures).fill(0);
let bias = 0;
const lr = 0.05;
const lambda = 0.01;
const epochs = 150;

// Class weights to address 93/7 imbalance
const nTrain = X_train.length;
const nPos = trainSuccess;
const nNeg = nTrain - nPos;
const wPos = 1.0;
const wNeg = nPos / nNeg; // weight failures higher so model learns risk boundary

console.log(`Weights: Success=1.0, Failure=${wNeg.toFixed(2)}`);

for (let epoch = 0; epoch < epochs; epoch++) {
  const gradW = new Array(numFeatures).fill(0);
  let gradB = 0;
  let loss = 0;

  for (let i = 0; i < nTrain; i++) {
    const x = X_train[i];
    const y = y_train[i];
    const sampleWeight = y === 1 ? wPos : wNeg;

    let z = bias;
    for (let j = 0; j < numFeatures; j++) {
      z += weights[j] * x[j];
    }
    const p = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));

    loss += sampleWeight * (-y * Math.log(Math.max(1e-7, p)) - (1 - y) * Math.log(Math.max(1e-7, 1 - p)));

    const err = sampleWeight * (p - y);
    for (let j = 0; j < numFeatures; j++) {
      gradW[j] += err * x[j];
    }
    gradB += err;
  }

  // Update weights
  for (let j = 0; j < numFeatures; j++) {
    weights[j] -= lr * (gradW[j] / nTrain + (lambda / nTrain) * weights[j]);
  }
  bias -= lr * (gradB / nTrain);

  if (epoch % 30 === 0 || epoch === epochs - 1) {
    console.log(`Epoch ${epoch}: Loss = ${(loss / nTrain).toFixed(4)}`);
  }
}

// 5. Evaluate on Unseen Test Set
let TP = 0, FP = 0, TN = 0, FN = 0;
const testProbs = [];

for (let i = 0; i < X_test.length; i++) {
  const x = X_test[i];
  const y = y_test[i];
  let z = bias;
  for (let j = 0; j < numFeatures; j++) {
    z += weights[j] * x[j];
  }
  const p = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
  testProbs.push({ p, y });

  const pred = p >= 0.5 ? 1 : 0;
  if (pred === 1 && y === 1) TP++;
  else if (pred === 1 && y === 0) FP++;
  else if (pred === 0 && y === 0) TN++;
  else if (pred === 0 && y === 1) FN++;
}

const nTest = X_test.length;
const accuracy = (TP + TN) / nTest;
const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

// Baseline majority class
const baselineAcc = testSuccess / nTest;

console.log('--- TEST SET EVALUATION ---');
console.log(`Confusion Matrix: TP=${TP}, FP=${FP}, TN=${TN}, FN=${FN}`);
console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}% (Baseline: ${(baselineAcc * 100).toFixed(2)}%)`);
console.log(`Precision: ${(precision * 100).toFixed(2)}%`);
console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
console.log(`F1 Score: ${(f1 * 100).toFixed(2)}%`);
console.log(`Failure recall (detected failures): ${TN}/${TN+FP} (${((TN/(TN+FP))*100).toFixed(1)}%)`);

// ROC AUC
testProbs.sort((a,b) => b.p - a.p);
let rankSum = 0;
let n1 = testSuccess, n0 = nTest - testSuccess;
for (let i = 0; i < testProbs.length; i++) {
  if (testProbs[i].y === 1) {
    rankSum += (nTest - i);
  }
}
const auc = (rankSum - (n1 * (n1 + 1)) / 2) / (n1 * n0);
console.log(`ROC-AUC: ${auc.toFixed(3)}`);

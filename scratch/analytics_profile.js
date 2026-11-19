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

const pMassIdx = headers.indexOf('payload_mass_t');
const apogeeIdx = headers.indexOf('apogee_km');
const perigeeIdx = headers.indexOf('perigee_km');
const incIdx = headers.indexOf('inclination_deg');
const lClassIdx = headers.indexOf('launch_class');
const outcomeIdx = headers.indexOf('outcome');
const vehicleIdx = headers.indexOf('launch_vehicle');
const countryIdx = headers.indexOf('launch_country');
const missionIdx = headers.indexOf('mission');
const dateIdx = headers.indexOf('date');

console.log('--- 1. PAYLOAD MASS ANALYSIS ---');
const validMasses = [];
let totalMass = 0;
for (let i = 1; i < rows.length; i++) {
  const val = rows[i][pMassIdx]?.trim();
  if (val && val !== '' && !isNaN(val)) {
    const num = parseFloat(val);
    validMasses.push({
      mass: num,
      mission: rows[i][missionIdx] || 'N/A',
      vehicle: rows[i][vehicleIdx],
      country: rows[i][countryIdx],
      date: rows[i][dateIdx]
    });
    totalMass += num;
  }
}
validMasses.sort((a,b) => a.mass - b.mass);
const medianMass = validMasses[Math.floor(validMasses.length / 2)]?.mass;
const avgMass = totalMass / validMasses.length;
console.log('Valid payload mass records:', validMasses.length, 'out of', rows.length - 1);
console.log('Total payload mass (tonnes):', totalMass.toFixed(1));
console.log('Average payload mass (tonnes):', avgMass.toFixed(2));
console.log('Median payload mass (tonnes):', medianMass);
console.log('Min payload mass:', validMasses[0]?.mass);
console.log('Max payload mass:', validMasses[validMasses.length - 1]?.mass);
console.log('Top 5 highest payload masses:');
console.log(validMasses.slice(-5).reverse());

console.log('--- 2. ORBITAL / TRAJECTORY ANALYSIS ---');
const validApogee = [];
const validPerigee = [];
const validInc = [];
for (let i = 1; i < rows.length; i++) {
  const ap = rows[i][apogeeIdx]?.trim();
  const pe = rows[i][perigeeIdx]?.trim();
  const inc = rows[i][incIdx]?.trim();
  if (ap && ap !== '' && !isNaN(ap)) validApogee.push(parseFloat(ap));
  if (pe && pe !== '' && !isNaN(pe)) validPerigee.push(parseFloat(pe));
  if (inc && inc !== '' && !isNaN(inc)) validInc.push(parseFloat(inc));
}
validApogee.sort((a,b) => a - b);
validPerigee.sort((a,b) => a - b);
validInc.sort((a,b) => a - b);
console.log('Valid Apogee count:', validApogee.length, 'Median:', validApogee[Math.floor(validApogee.length/2)], 'Max:', validApogee[validApogee.length-1]);
console.log('Valid Perigee count:', validPerigee.length, 'Median:', validPerigee[Math.floor(validPerigee.length/2)], 'Max:', validPerigee[validPerigee.length-1]);
console.log('Valid Inclination count:', validInc.length, 'Median:', validInc[Math.floor(validInc.length/2)], 'Min:', validInc[0], 'Max:', validInc[validInc.length-1]);

console.log('--- 3. LAUNCH CLASS (ORBITAL vs DEEP SPACE) ---');
const classCounts = {};
for (let i = 1; i < rows.length; i++) {
  const lc = rows[i][lClassIdx]?.trim() || 'Unknown';
  const out = rows[i][outcomeIdx]?.trim() || 'Unknown';
  if (!classCounts[lc]) classCounts[lc] = { total: 0, success: 0, failure: 0 };
  classCounts[lc].total++;
  if (out === 'Success') classCounts[lc].success++;
  else if (out === 'Failure') classCounts[lc].failure++;
}
console.log('Class counts:', classCounts);

console.log('--- 4. PAYLOAD MASS BY COUNTRY ---');
const countryMass = {};
for (let i = 1; i < rows.length; i++) {
  const c = rows[i][countryIdx]?.trim() || 'Unknown';
  const m = parseFloat(rows[i][pMassIdx]?.trim() || '0');
  if (!countryMass[c]) countryMass[c] = { totalMass: 0, count: 0, maxMass: 0 };
  if (!isNaN(m) && m > 0) {
    countryMass[c].totalMass += m;
    countryMass[c].count++;
    if (m > countryMass[c].maxMass) countryMass[c].maxMass = m;
  }
}
const sortedCountryMass = Object.entries(countryMass)
  .map(([country, d]) => ({
    country,
    totalMass: Number(d.totalMass.toFixed(1)),
    avgMass: d.count > 0 ? Number((d.totalMass / d.count).toFixed(2)) : 0,
    maxMass: Number(d.maxMass.toFixed(2)),
    count: d.count
  }))
  .sort((a,b) => b.totalMass - a.totalMass);
console.log('Top 8 Countries by Total Mass:');
console.log(sortedCountryMass.slice(0, 8));

console.log('--- 5. TOP 10 VEHICLES BY LAUNCH COUNT ---');
const vehicleStats = {};
for (let i = 1; i < rows.length; i++) {
  const v = rows[i][vehicleIdx]?.trim() || 'Unknown';
  const out = rows[i][outcomeIdx]?.trim();
  const c = rows[i][countryIdx]?.trim();
  const m = parseFloat(rows[i][pMassIdx]?.trim() || '0');
  if (!vehicleStats[v]) vehicleStats[v] = { total: 0, success: 0, failure: 0, totalMass: 0, massCount: 0, country: c };
  vehicleStats[v].total++;
  if (out === 'Success') vehicleStats[v].success++;
  else if (out === 'Failure') vehicleStats[v].failure++;
  if (!isNaN(m) && m > 0) {
    vehicleStats[v].totalMass += m;
    vehicleStats[v].massCount++;
  }
}
const topVehicles = Object.entries(vehicleStats)
  .map(([vehicle, d]) => ({
    vehicle,
    total: d.total,
    success: d.success,
    failure: d.failure,
    successRate: Number(((d.success / d.total) * 100).toFixed(1)),
    avgMass: d.massCount > 0 ? Number((d.totalMass / d.massCount).toFixed(2)) : 0,
    country: d.country
  }))
  .sort((a,b) => b.total - a.total)
  .slice(0, 10);
console.log(topVehicles);

console.log('--- 6. INCLINATION DISTRIBUTION CLUSTERS ---');
const incClusters = {
  'Equatorial (< 20°)': 0,
  'Cape Canaveral (20°–35°)': 0,
  'Mid-Latitude / ISS (45°–55°)': 0,
  'Molniya / Russian (60°–75°)': 0,
  'Sun-Synchronous & Polar (80°–105°)': 0,
  'Retrograde (> 105°)': 0
};
for (const inc of validInc) {
  if (inc < 20) incClusters['Equatorial (< 20°)']++;
  else if (inc >= 20 && inc < 35) incClusters['Cape Canaveral (20°–35°)']++;
  else if (inc >= 45 && inc < 55) incClusters['Mid-Latitude / ISS (45°–55°)']++;
  else if (inc >= 60 && inc < 75) incClusters['Molniya / Russian (60°–75°)']++;
  else if (inc >= 80 && inc <= 105) incClusters['Sun-Synchronous & Polar (80°–105°)']++;
  else if (inc > 105) incClusters['Retrograde (> 105°)']++;
}
console.log(incClusters);

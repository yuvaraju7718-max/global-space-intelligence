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
console.log('Parsed rows:', rows.length);
const headers = rows[0].map(h => h.trim());

const outcomeIdx = headers.indexOf('outcome');
const outcomes = {};
for (let i = 1; i < rows.length; i++) {
  const o = rows[i][outcomeIdx].trim();
  outcomes[o] = (outcomes[o] || 0) + 1;
}
console.log('Actual Outcomes:', outcomes);

const countryIdx = headers.indexOf('launch_country');
const countries = {};
for (let i = 1; i < rows.length; i++) {
  const c = rows[i][countryIdx].trim();
  countries[c] = (countries[c] || 0) + 1;
}
console.log('Actual Countries count:', Object.keys(countries).length);
console.log('Top countries:', Object.entries(countries).sort((a,b) => b[1] - a[1]));

const yearIdx = headers.indexOf('year');
const years = {};
for (let i = 1; i < rows.length; i++) {
  const y = rows[i][yearIdx].trim();
  years[y] = (years[y] || 0) + 1;
}
console.log('Year count:', Object.keys(years).length);
console.log('Min year:', Math.min(...Object.keys(years).map(Number)));
console.log('Max year:', Math.max(...Object.keys(years).map(Number)));
console.log('Year 2026 launches:', years['2026']);

const yearStats = {};
for (let i = 1; i < rows.length; i++) {
  const yr = parseInt(rows[i][yearIdx], 10);
  const out = rows[i][outcomeIdx].trim();
  if (!yearStats[yr]) yearStats[yr] = { total: 0, success: 0, failure: 0 };
  yearStats[yr].total++;
  if (out === 'Success') yearStats[yr].success++;
  else if (out === 'Failure') yearStats[yr].failure++;
}

const sortedYears = Object.entries(yearStats).sort((a,b) => b[1].total - a[1].total);
console.log('Top 5 Peak Launch Years:', sortedYears.slice(0, 5));

// Test Country Deep Profile for USA, China, India, and Australia (small sample)
function getCountryDeepProfile(records, country) {
  const norm = country.toLowerCase().trim();
  const matched = records.filter(r => r.launch_country && r.launch_country.toLowerCase().trim() === norm);
  
  let success = 0, failure = 0;
  const vehicleMap = new Map();
  const agencyMap = new Map();
  const yearMap = new Map();
  let firstYear = Infinity, latestYear = -Infinity;

  for (const r of matched) {
    if (r.outcome === 'Success') success++;
    else if (r.outcome === 'Failure') failure++;

    if (r.launch_vehicle) {
      const v = vehicleMap.get(r.launch_vehicle) || { count: 0, success: 0 };
      v.count++;
      if (r.outcome === 'Success') v.success++;
      vehicleMap.set(r.launch_vehicle, v);
    }

    if (r.agency) {
      const a = agencyMap.get(r.agency) || { count: 0, success: 0 };
      a.count++;
      if (r.outcome === 'Success') a.success++;
      agencyMap.set(r.agency, a);
    }

    const yr = r.year;
    if (yr < firstYear) firstYear = yr;
    if (yr > latestYear) latestYear = yr;

    const yEntry = yearMap.get(yr) || { year: yr, total: 0, success: 0, failure: 0 };
    yEntry.total++;
    if (r.outcome === 'Success') yEntry.success++;
    else if (r.outcome === 'Failure') yEntry.failure++;
    yearMap.set(yr, yEntry);
  }

  const topVehicles = Array.from(vehicleMap.entries())
    .map(([vehicle, d]) => ({
      vehicle,
      count: d.count,
      successRate: Number(((d.success / d.count) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topAgencies = Array.from(agencyMap.entries())
    .map(([agency, d]) => ({
      agency,
      count: d.count,
      successRate: Number(((d.success / d.count) * 100).toFixed(1))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const yearlyCadence = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return {
    country,
    total: matched.length,
    success,
    failure,
    successRate: matched.length > 0 ? Number(((success / matched.length) * 100).toFixed(1)) : 0,
    firstYear: firstYear === Infinity ? null : firstYear,
    latestYear: latestYear === -Infinity ? null : latestYear,
    topVehicles,
    topAgencies,
    yearlyCadence,
    isSmallSample: matched.length < 20
  };
}

// Convert parsed rows into minimal records
const records = [];
for (let i = 1; i < rows.length; i++) {
  records.push({
    launch_country: rows[i][countryIdx].trim(),
    outcome: rows[i][outcomeIdx].trim(),
    year: parseInt(rows[i][yearIdx].trim(), 10),
    launch_vehicle: rows[i][headers.indexOf('launch_vehicle')].trim(),
    agency: rows[i][headers.indexOf('agency')].trim()
  });
}

console.log('USA profile:', getCountryDeepProfile(records, 'USA'));
console.log('India profile:', getCountryDeepProfile(records, 'India'));
console.log('Australia profile (small sample):', getCountryDeepProfile(records, 'Australia'));

// Inspect top 15 agencies from real dataset
const agencyMap = new Map();
for (let i = 1; i < rows.length; i++) {
  const a = rows[i][headers.indexOf('agency')].trim() || 'Unknown';
  const out = rows[i][outcomeIdx].trim();
  const c = rows[i][countryIdx].trim();
  const entry = agencyMap.get(a) || { total: 0, success: 0, failure: 0, country: c };
  entry.total++;
  if (out === 'Success') entry.success++;
  else if (out === 'Failure') entry.failure++;
  agencyMap.set(a, entry);
}
const topAgencies = Array.from(agencyMap.entries()).sort((a,b) => b[1].total - a[1].total).slice(0, 15);
console.log('Top 15 Real Agencies in Dataset:');
topAgencies.forEach(([name, d], idx) => {
  console.log(`${idx+1}. ${name} (${d.country}): ${d.total} launches, SR: ${((d.success/d.total)*100).toFixed(1)}%`);
});

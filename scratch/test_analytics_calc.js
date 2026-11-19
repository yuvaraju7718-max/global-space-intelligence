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

// Transform into CleanedMissionRecord
const records = [];
for (let i = 1; i < rows.length; i++) {
  records.push({
    launch_tag: rows[i][0].trim(),
    date: rows[i][1].trim(),
    time_utc: rows[i][2]?.trim() || null,
    year: parseInt(rows[i][3].trim(), 10) || 1957,
    launch_vehicle: rows[i][4].trim(),
    flight: rows[i][5]?.trim() || null,
    mission: rows[i][6]?.trim() || null,
    launch_site: rows[i][7].trim(),
    launch_pad: rows[i][8]?.trim() || null,
    site_country: rows[i][9].trim(),
    agency: rows[i][10].trim(),
    launch_country: rows[i][11].trim(),
    launch_class: rows[i][12].trim() === 'Deep space' ? 'Deep space' : 'Orbital',
    outcome: rows[i][13].trim() === 'Failure' ? 'Failure' : 'Success',
    launch_code: rows[i][14].trim(),
    apogee_km: rows[i][15]?.trim() && !isNaN(rows[i][15]) ? parseFloat(rows[i][15]) : null,
    perigee_km: rows[i][16]?.trim() && !isNaN(rows[i][16]) ? parseFloat(rows[i][16]) : null,
    inclination_deg: rows[i][17]?.trim() && !isNaN(rows[i][17]) ? parseFloat(rows[i][17]) : null,
    payload_mass_t: rows[i][18]?.trim() && !isNaN(rows[i][18]) ? parseFloat(rows[i][18]) : null,
  });
}

console.log('Parsed Cleaned Records:', records.length);

// Calculate Payload Mass Stats
function calculatePayloadMassStats(recs) {
  const valid = recs.filter(r => r.payload_mass_t !== null && r.payload_mass_t !== undefined);
  if (valid.length === 0) {
    return { totalMassT: 0, averageMassT: 0, medianMassT: 0, maxMassT: 0, validCount: 0, topHeaviestMissions: [], massBuckets: [], countryMassBreakdown: [] };
  }
  const sorted = [...valid].sort((a,b) => (a.payload_mass_t || 0) - (b.payload_mass_t || 0));
  const total = sorted.reduce((sum, r) => sum + (r.payload_mass_t || 0), 0);
  const avg = total / sorted.length;
  const med = sorted[Math.floor(sorted.length / 2)].payload_mass_t || 0;
  const max = sorted[sorted.length - 1].payload_mass_t || 0;

  const buckets = [
    { category: 'Cubesat / SmallSat', rangeLabel: '< 1.0 t', min: 0, max: 1.0, color: '#39D5F2', count: 0 },
    { category: 'Light Payload', rangeLabel: '1.0 – 5.0 t', min: 1.0, max: 5.0, color: '#10B981', count: 0 },
    { category: 'Medium Lift', rangeLabel: '5.0 – 15.0 t', min: 5.0, max: 15.0, color: '#648CFF', count: 0 },
    { category: 'Heavy Lift', rangeLabel: '15.0 – 50.0 t', min: 15.0, max: 50.0, color: '#A78BFA', count: 0 },
    { category: 'Super Heavy / Crew', rangeLabel: '> 50.0 t', min: 50.0, max: Infinity, color: '#F59E0B', count: 0 }
  ];

  sorted.forEach(r => {
    const m = r.payload_mass_t || 0;
    for (const b of buckets) {
      if (m >= b.min && (b.max === Infinity ? true : m < b.max)) {
        b.count++;
        break;
      }
    }
  });

  const massBuckets = buckets.map(b => ({
    category: b.category,
    rangeLabel: b.rangeLabel,
    count: b.count,
    percent: Number(((b.count / sorted.length) * 100).toFixed(1)),
    color: b.color
  }));

  const topHeaviestMissions = [...sorted]
    .reverse()
    .slice(0, 5)
    .map(r => ({
      massT: r.payload_mass_t || 0,
      mission: r.mission || r.flight || r.launch_vehicle,
      vehicle: r.launch_vehicle,
      country: r.launch_country || r.site_country,
      date: r.date,
      launchTag: r.launch_tag,
      outcome: r.outcome
    }));

  // Country breakdown
  const cMap = new Map();
  sorted.forEach(r => {
    const c = r.launch_country || 'Unknown';
    const entry = cMap.get(c) || { totalMass: 0, count: 0, maxMass: 0 };
    const m = r.payload_mass_t || 0;
    entry.totalMass += m;
    entry.count++;
    if (m > entry.maxMass) entry.maxMass = m;
    cMap.set(c, entry);
  });

  const countryMassBreakdown = Array.from(cMap.entries())
    .map(([country, d]) => ({
      country,
      totalMassT: Number(d.totalMass.toFixed(1)),
      averageMassT: Number((d.totalMass / d.count).toFixed(2)),
      maxMassT: Number(d.maxMass.toFixed(2)),
      count: d.count
    }))
    .sort((a,b) => b.totalMassT - a.totalMassT)
    .slice(0, 8);

  return {
    totalMassT: Number(total.toFixed(1)),
    averageMassT: Number(avg.toFixed(2)),
    medianMassT: Number(med.toFixed(2)),
    maxMassT: Number(max.toFixed(2)),
    validCount: sorted.length,
    topHeaviestMissions,
    massBuckets,
    countryMassBreakdown
  };
}

console.log('Payload Mass Stats Result:');
const pRes = calculatePayloadMassStats(records);
console.log('Total Mass:', pRes.totalMassT, 'Avg:', pRes.averageMassT, 'Median:', pRes.medianMassT);
console.log('Buckets:', pRes.massBuckets);
console.log('Top Countries by Mass:', pRes.countryMassBreakdown);

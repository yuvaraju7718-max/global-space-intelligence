// Testing mlService logic
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

const records = [];
for (let i = 1; i < rows.length; i++) {
  records.push({
    launch_tag: rows[i][0].trim(),
    date: rows[i][1].trim(),
    year: parseInt(rows[i][3].trim(), 10) || 1957,
    launch_vehicle: rows[i][4].trim(),
    launch_site: rows[i][7].trim(),
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

console.log('Testing ML service with', records.length, 'records.');

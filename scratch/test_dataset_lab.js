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
console.log('Total Rows:', rows.length - 1);
console.log('Total Columns:', headers.length);
console.log('Headers:', headers);

let totalCells = (rows.length - 1) * headers.length;
let totalMissing = 0;
const columnStats = headers.map((col, colIdx) => {
  let nullCount = 0;
  const distinct = new Set();
  const numValues = [];
  const valFreq = {};

  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i][colIdx];
    const trimmed = raw !== undefined && raw !== null ? raw.trim() : '';
    if (trimmed === '' || trimmed.toLowerCase() === 'nan' || trimmed.toLowerCase() === 'null') {
      nullCount++;
      totalMissing++;
    } else {
      distinct.add(trimmed);
      valFreq[trimmed] = (valFreq[trimmed] || 0) + 1;
      const num = parseFloat(trimmed);
      if (!isNaN(num)) numValues.push(num);
    }
  }

  numValues.sort((a,b) => a - b);
  const min = numValues.length > 0 ? numValues[0] : null;
  const max = numValues.length > 0 ? numValues[numValues.length - 1] : null;
  const mean = numValues.length > 0 ? Number((numValues.reduce((s,v)=>s+v,0)/numValues.length).toFixed(2)) : null;
  const median = numValues.length > 0 ? numValues[Math.floor(numValues.length / 2)] : null;

  const topValues = Object.entries(valFreq)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 4)
    .map(([val, count]) => ({ value: val, count }));

  return {
    col,
    nullCount,
    nonNullCount: (rows.length - 1) - nullCount,
    missingPercent: Number(((nullCount / (rows.length - 1)) * 100).toFixed(2)),
    distinctCount: distinct.size,
    isNumeric: numValues.length === ((rows.length - 1) - nullCount) && numValues.length > 0,
    min,
    max,
    mean,
    median,
    topValues
  };
});

console.log('Total Cells:', totalCells);
console.log('Total Missing Cells:', totalMissing);
console.log('Overall Completeness:', ((1 - (totalMissing / totalCells)) * 100).toFixed(2) + '%');
console.log('\nColumn Completeness Profiles:');
columnStats.forEach(cs => {
  console.log(`${cs.col.padEnd(16)} | Missing: ${String(cs.nullCount).padStart(5)} (${cs.missingPercent.toFixed(1).padStart(5)}%) | Distinct: ${String(cs.distinctCount).padStart(5)} | ${cs.isNumeric ? `Numeric [${cs.min}..${cs.max}, mean=${cs.mean}, med=${cs.median}]` : `Top: ${cs.topValues.map(t=>`${t.value}(${t.count})`).join(', ')}`}`);
});

import {
  CleanedMissionRecord,
  LaunchOutcome,
  LaunchClass,
  DatasetSummaryStats,
  YearCadenceStat,
  DecadeCadenceStat,
  CountryAggStat,
  AgencyRankingStat,
  VehicleRankingStat,
  LaunchSiteFreqStat,
  ColumnProfileStat,
  GlobalSpaceAnalytics
} from '../types';

/**
 * Verified Launch Complex Coordinates Database (WGS84)
 * Only documented historical coordinates are mapped.
 * Unrecognized or mobile sea sites resolve safely to null.
 */
export const VERIFIED_LAUNCH_SITE_COORDINATES: Record<string, [number, number]> = {
  'Plesetsk': [62.9272, 40.5750],
  'Baykonur': [45.9650, 63.3050],
  'Canaveral': [28.4889, -80.5778],
  'Vandenberg': [34.7420, -120.5724],
  'Kourou': [5.2372, -52.7606],
  'Jiuquan': [40.9606, 100.2983],
  'Kennedy': [28.5728, -80.6490],
  'Xichang': [28.2460, 102.0280],
  'Taiyuan': [38.8480, 111.6080],
  'Sriharikota': [13.7199, 80.2305],
  'Kapustin Yar': [48.5688, 45.8208],
  'Tanegashima': [30.4000, 130.9700],
  'Mahia': [-39.2604, 177.8647],
  'Wenchang': [19.6145, 110.9510],
  'Pt Arguello': [34.6136, -120.6275],
  'Wallops MARS': [37.8337, -75.4880],
  'Wallops I': [37.8337, -75.4880],
  'Kagoshima': [31.2510, 131.0820],
  'Uchinoura': [31.2510, 131.0820],
  'Hainan CLS': [19.6145, 110.9510],
  'Vostochniy': [51.8844, 128.3339],
  'Semnan': [35.2346, 53.9209],
  'Palmachim': [31.8978, 34.6908],
  'Starbase': [25.9972, -97.1561],
  'Kwajalein': [9.0480, 167.7430],
  'Kodiak': [57.4358, -152.3397],
  'San Marco': [-2.9956, 40.2139],
  'Naro': [34.4319, 127.5350],
  'Woomera': [-30.9553, 136.5322],
  'Alcantara': [-2.3731, -44.3964],
  'Andoya': [69.2942, 16.0208],
  'Edwards AFB': [34.9055, -117.8837],
  'Hammaguir': [30.8997, -3.0583],
  'Svobodniy': [51.7944, 128.1250],
  'Shahroud': [36.2167, 55.3333],
  'Tonghae': [40.8500, 129.6667],
  'Kirimati': [1.8833, -157.4000],
  'China Lake': [35.6500, -117.6500],
  'Mojave': [35.0594, -118.1517],
  'Kauai': [22.0620, -159.7820],
  'Bowen': [-20.0167, 148.2500],
  'Newquay': [50.4406, -4.9953]
};

/**
 * Robust RFC 4180 compliant CSV parser.
 * Accurately parses quoted entries, internal commas, escaped quotes (""), and empty values.
 */
export function parseCSVToRows(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken);
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // consume CRLF
      }
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

/**
 * Safely parse a nullable numeric field without silently coercing missing values to 0.
 */
function parseNullableNumber(value: string | undefined): number | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'nan' || trimmed.toLowerCase() === 'null') {
    return null;
  }
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse a nullable string field without whitespace artifacts.
 */
function parseNullableString(value: string | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Transforms raw CSV rows into typed CleanedMissionRecord objects.
 */
export function transformRowsToRecords(rows: string[][]): CleanedMissionRecord[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const dataRows = rows.slice(1);

  return dataRows.map((cols) => {
    // Map column indexes by header name or direct order
    const getCol = (name: string, fallbackIdx: number): string => {
      const idx = headers.indexOf(name);
      return idx !== -1 ? (cols[idx] ?? '') : (cols[fallbackIdx] ?? '');
    };

    const outcomeRaw = getCol('outcome', 13).trim();
    const outcome: LaunchOutcome = outcomeRaw === 'Failure' ? 'Failure' : 'Success';

    const launchClassRaw = getCol('launch_class', 12).trim();
    const launch_class: LaunchClass = launchClassRaw === 'Deep space' ? 'Deep space' : 'Orbital';

    const yearRaw = parseInt(getCol('year', 3).trim(), 10);
    const year = isNaN(yearRaw) ? 1957 : yearRaw;

    return {
      launch_tag: getCol('launch_tag', 0).trim(),
      date: getCol('date', 1).trim(),
      time_utc: parseNullableString(getCol('time_utc', 2)),
      year,
      launch_vehicle: getCol('launch_vehicle', 4).trim(),
      flight: parseNullableString(getCol('flight', 5)),
      mission: parseNullableString(getCol('mission', 6)),
      launch_site: getCol('launch_site', 7).trim(),
      launch_pad: parseNullableString(getCol('launch_pad', 8)),
      site_country: getCol('site_country', 9).trim(),
      agency: getCol('agency', 10).trim(),
      launch_country: getCol('launch_country', 11).trim(),
      launch_class,
      outcome,
      launch_code: getCol('launch_code', 14).trim(),
      apogee_km: parseNullableNumber(getCol('apogee_km', 15)),
      perigee_km: parseNullableNumber(getCol('perigee_km', 16)),
      inclination_deg: parseNullableNumber(getCol('inclination_deg', 17)),
      payload_mass_t: parseNullableNumber(getCol('payload_mass_t', 18))
    };
  });
}

// In-memory cache for parsed missions
let cachedMissions: CleanedMissionRecord[] | null = null;
let cachePromise: Promise<CleanedMissionRecord[]> | null = null;

/**
 * Loads and parses the canonical space missions CSV file.
 * Caches in memory for rapid instant access.
 */
export async function loadCleanedSpaceMissions(
  csvUrl = '/data/global_space_missions_cleaned.csv'
): Promise<CleanedMissionRecord[]> {
  if (cachedMissions) {
    return cachedMissions;
  }

  if (cachePromise) {
    return cachePromise;
  }

  cachePromise = (async () => {
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: HTTP ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      const rows = parseCSVToRows(text);
      const records = transformRowsToRecords(rows);

      if (records.length === 0) {
        throw new Error('Dataset file is empty or headers could not be parsed.');
      }

      cachedMissions = records;
      return records;
    } catch (err) {
      cachePromise = null; // reset to allow retry
      console.error('[GSI Data Engine] Dataset loading error:', err);
      throw err;
    }
  })();

  return cachePromise;
}

/**
 * 1. Summary KPIs calculation
 */
export function calculateSummaryStats(records: CleanedMissionRecord[]): DatasetSummaryStats {
  const totalLaunches = records.length;
  let successfulLaunches = 0;
  let failedLaunches = 0;
  let orbitalMissions = 0;
  let deepSpaceMissions = 0;

  const countries = new Set<string>();
  const agencies = new Set<string>();
  const vehicles = new Set<string>();
  const sites = new Set<string>();

  let yearMin = Infinity;
  let yearMax = -Infinity;

  for (let i = 0; i < totalLaunches; i++) {
    const r = records[i];
    if (r.outcome === 'Success') successfulLaunches++;
    else if (r.outcome === 'Failure') failedLaunches++;

    if (r.launch_class === 'Orbital') orbitalMissions++;
    else if (r.launch_class === 'Deep space') deepSpaceMissions++;

    if (r.launch_country) countries.add(r.launch_country);
    if (r.agency) agencies.add(r.agency);
    if (r.launch_vehicle) vehicles.add(r.launch_vehicle);
    if (r.launch_site) sites.add(r.launch_site);

    if (r.year < yearMin) yearMin = r.year;
    if (r.year > yearMax) yearMax = r.year;
  }

  const successRate = totalLaunches > 0
    ? Number(((successfulLaunches / totalLaunches) * 100).toFixed(2))
    : 0;

  return {
    totalLaunches,
    successfulLaunches,
    failedLaunches,
    successRate,
    orbitalMissions,
    deepSpaceMissions,
    uniqueCountries: countries.size,
    uniqueAgencies: agencies.size,
    uniqueVehicles: vehicles.size,
    uniqueLaunchSites: sites.size,
    yearMin: yearMin === Infinity ? 1957 : yearMin,
    yearMax: yearMax === -Infinity ? 2026 : yearMax
  };
}

/**
 * 2. Year-wise cadence calculation
 */
export function calculateYearCadence(records: CleanedMissionRecord[]): YearCadenceStat[] {
  const map = new Map<number, { total: number; success: number; failure: number }>();

  for (const r of records) {
    const entry = map.get(r.year) || { total: 0, success: 0, failure: 0 };
    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;
    map.set(r.year, entry);
  }

  const result: YearCadenceStat[] = [];
  const sortedYears = Array.from(map.keys()).sort((a, b) => a - b);

  for (const yr of sortedYears) {
    const item = map.get(yr)!;
    result.push({
      year: yr,
      total: item.total,
      success: item.success,
      failure: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0
    });
  }

  return result;
}

/**
 * 3. Decade-wise cadence calculation
 */
export function calculateDecadeCadence(records: CleanedMissionRecord[]): DecadeCadenceStat[] {
  const map = new Map<string, { total: number; success: number; failure: number }>();

  for (const r of records) {
    const decadeStart = Math.floor(r.year / 10) * 10;
    const decadeLabel = `${decadeStart}s`;
    const entry = map.get(decadeLabel) || { total: 0, success: 0, failure: 0 };
    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;
    map.set(decadeLabel, entry);
  }

  const decadesOrder = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
  const result: DecadeCadenceStat[] = [];

  for (const dec of decadesOrder) {
    const item = map.get(dec) || { total: 0, success: 0, failure: 0 };
    if (item.total > 0) {
      result.push({
        decade: dec,
        total: item.total,
        success: item.success,
        failure: item.failure,
        successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0
      });
    }
  }

  return result;
}

/**
 * 4. Country-wise launch counts and success rates
 */
export function calculateCountryStats(records: CleanedMissionRecord[]): CountryAggStat[] {
  const map = new Map<string, {
    total: number;
    success: number;
    failure: number;
    firstYear: number;
    latestYear: number;
  }>();

  const totalAll = records.length;

  for (const r of records) {
    const country = r.launch_country || 'Unknown';
    const entry = map.get(country) || {
      total: 0,
      success: 0,
      failure: 0,
      firstYear: r.year,
      latestYear: r.year
    };

    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    if (r.year < entry.firstYear) entry.firstYear = r.year;
    if (r.year > entry.latestYear) entry.latestYear = r.year;

    map.set(country, entry);
  }

  const result: CountryAggStat[] = [];
  for (const [country, item] of map.entries()) {
    result.push({
      country,
      total: item.total,
      successful: item.success,
      failed: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0,
      shareOfGlobal: totalAll > 0 ? Number(((item.total / totalAll) * 100).toFixed(2)) : 0,
      firstLaunchYear: item.firstYear,
      latestLaunchYear: item.latestYear
    });
  }

  // Sort descending by total launches
  result.sort((a, b) => b.total - a.total);
  return result;
}

/**
 * 5. Agency Rankings
 */
export function calculateAgencyRankings(
  records: CleanedMissionRecord[],
  topN = 50
): AgencyRankingStat[] {
  const map = new Map<string, { total: number; success: number; failure: number; countryMap: Map<string, number> }>();

  for (const r of records) {
    const agency = r.agency || 'Unknown';
    const entry = map.get(agency) || { total: 0, success: 0, failure: 0, countryMap: new Map<string, number>() };
    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    const country = r.launch_country || r.site_country || '';
    if (country) {
      entry.countryMap.set(country, (entry.countryMap.get(country) || 0) + 1);
    }
    map.set(agency, entry);
  }

  const result: AgencyRankingStat[] = [];
  for (const [agency, item] of map.entries()) {
    // Find primary associated country
    let topCountry = '';
    let maxC = 0;
    for (const [c, count] of item.countryMap.entries()) {
      if (count > maxC) {
        maxC = count;
        topCountry = c;
      }
    }

    result.push({
      agency,
      total: item.total,
      successful: item.success,
      failed: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0,
      primaryCountry: topCountry
    });
  }

  result.sort((a, b) => b.total - a.total);
  return topN > 0 ? result.slice(0, topN) : result;
}

/**
 * 6. Launch Vehicle Rankings
 */
export function calculateVehicleRankings(
  records: CleanedMissionRecord[],
  topN = 50
): VehicleRankingStat[] {
  const map = new Map<string, { total: number; success: number; failure: number; agencyMap: Map<string, number> }>();

  for (const r of records) {
    const vehicle = r.launch_vehicle || 'Unknown';
    const entry = map.get(vehicle) || { total: 0, success: 0, failure: 0, agencyMap: new Map<string, number>() };
    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    if (r.agency) {
      entry.agencyMap.set(r.agency, (entry.agencyMap.get(r.agency) || 0) + 1);
    }
    map.set(vehicle, entry);
  }

  const result: VehicleRankingStat[] = [];
  for (const [vehicle, item] of map.entries()) {
    let topAgency = '';
    let maxA = 0;
    for (const [a, count] of item.agencyMap.entries()) {
      if (count > maxA) {
        maxA = count;
        topAgency = a;
      }
    }

    result.push({
      vehicle,
      total: item.total,
      successful: item.success,
      failed: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0,
      primaryAgency: topAgency
    });
  }

  result.sort((a, b) => b.total - a.total);
  return topN > 0 ? result.slice(0, topN) : result;
}

/**
 * 7. Launch-Site Frequencies and Verified Coordinates
 * Unrecognized sites have coordinates = null and verified = false.
 */
export function calculateLaunchSiteStats(records: CleanedMissionRecord[]): LaunchSiteFreqStat[] {
  const map = new Map<string, { total: number; success: number; failure: number; countryMap: Map<string, number> }>();

  for (const r of records) {
    const site = r.launch_site || 'Unknown';
    const entry = map.get(site) || { total: 0, success: 0, failure: 0, countryMap: new Map<string, number>() };
    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    const country = r.site_country || r.launch_country || '';
    if (country) {
      entry.countryMap.set(country, (entry.countryMap.get(country) || 0) + 1);
    }
    map.set(site, entry);
  }

  const result: LaunchSiteFreqStat[] = [];
  for (const [siteName, item] of map.entries()) {
    let topCountry = '';
    let maxC = 0;
    for (const [c, count] of item.countryMap.entries()) {
      if (count > maxC) {
        maxC = count;
        topCountry = c;
      }
    }

    const coords = VERIFIED_LAUNCH_SITE_COORDINATES[siteName] ?? null;

    result.push({
      siteName,
      country: topCountry,
      totalLaunches: item.total,
      successful: item.success,
      failed: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0,
      coordinates: coords,
      verified: coords !== null
    });
  }

  result.sort((a, b) => b.totalLaunches - a.totalLaunches);
  return result;
}

/**
 * 8. Column Missing-Value and Distinct-Value Profiling for all 19 columns
 */
export function calculateColumnProfiles(records: CleanedMissionRecord[]): ColumnProfileStat[] {
  const columns: Array<{ field: keyof CleanedMissionRecord; inferredType: string }> = [
    { field: 'launch_tag', inferredType: 'string (UUID/Identifier)' },
    { field: 'date', inferredType: 'date (YYYY-MM-DD)' },
    { field: 'time_utc', inferredType: 'string (HH:MM:SS)' },
    { field: 'year', inferredType: 'int64' },
    { field: 'launch_vehicle', inferredType: 'string (Categorical)' },
    { field: 'flight', inferredType: 'string' },
    { field: 'mission', inferredType: 'string' },
    { field: 'launch_site', inferredType: 'string (Categorical)' },
    { field: 'launch_pad', inferredType: 'string' },
    { field: 'site_country', inferredType: 'string (Categorical)' },
    { field: 'agency', inferredType: 'string (Categorical)' },
    { field: 'launch_country', inferredType: 'string (Categorical)' },
    { field: 'launch_class', inferredType: 'string (Enum: Orbital | Deep space)' },
    { field: 'outcome', inferredType: 'string (Enum: Success | Failure)' },
    { field: 'launch_code', inferredType: 'string (Categorical)' },
    { field: 'apogee_km', inferredType: 'float64' },
    { field: 'perigee_km', inferredType: 'float64' },
    { field: 'inclination_deg', inferredType: 'float64' },
    { field: 'payload_mass_t', inferredType: 'float64' }
  ];

  const total = records.length;

  return columns.map(({ field, inferredType }) => {
    let nonNullCount = 0;
    const distinctSet = new Set<string | number>();
    const samples: (string | number | null)[] = [];

    for (let i = 0; i < total; i++) {
      const val = records[i][field];
      if (val !== null && val !== undefined) {
        nonNullCount++;
        distinctSet.add(val);
        if (samples.length < 3 && !samples.includes(val)) {
          samples.push(val);
        }
      }
    }

    const nullCount = total - nonNullCount;
    const missingPercent = total > 0 ? Number(((nullCount / total) * 100).toFixed(2)) : 0;

    return {
      field,
      inferredType,
      totalCount: total,
      nonNullCount,
      nullCount,
      missingPercent,
      distinctCount: distinctSet.size,
      sampleValues: samples
    };
  });
}

/**
 * 9. Master calculation method computing all dataset analytics in one call.
 */
export function calculateGlobalAnalytics(records: CleanedMissionRecord[]): GlobalSpaceAnalytics {
  return {
    summary: calculateSummaryStats(records),
    yearCadence: calculateYearCadence(records),
    decadeCadence: calculateDecadeCadence(records),
    countryStats: calculateCountryStats(records),
    agencyRankings: calculateAgencyRankings(records),
    vehicleRankings: calculateVehicleRankings(records),
    launchSiteStats: calculateLaunchSiteStats(records),
    columnProfiles: calculateColumnProfiles(records)
  };
}

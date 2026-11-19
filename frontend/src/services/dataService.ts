import {
  CleanedMissionRecord,
  LaunchOutcome,
  LaunchClass,
  DatasetSummaryStats,
  YearCadenceStat,
  DecadeCadenceStat,
  CountryAggStat,
  CountryDeepProfile,
  AgencyRankingStat,
  VehicleRankingStat,
  LaunchSiteFreqStat,
  ColumnProfileStat,
  GlobalSpaceAnalytics,
  PayloadMassStats,
  OrbitalTrajectoryStats,
  MissionClassStats,
  VehicleDetailedStat,
  MissionAnalyticsData
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

export const COUNTRY_CODE_MAP: Record<string, string> = {
  'USA': 'USA',
  'USSR': 'SUN',
  'Russia': 'RUS',
  'China': 'CHN',
  'France': 'FRA',
  'Japan': 'JPN',
  'India': 'IND',
  'New Zealand': 'NZL',
  'Iran': 'IRN',
  'ESA': 'ESA',
  'Israel': 'ISR',
  'Italy': 'ITA',
  'South Korea': 'KOR',
  'North Korea': 'PRK',
  'Cayman Is.': 'CYM',
  'ELDO': 'ELD',
  'Germany': 'DEU',
  'Brazil': 'BRA',
  'UK': 'GBR',
  'Australia': 'AUS'
};

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
      code: COUNTRY_CODE_MAP[country] || country.slice(0, 3).toUpperCase(),
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
  const map = new Map<string, {
    total: number;
    success: number;
    failure: number;
    countryMap: Map<string, number>;
    vehicleMap: Map<string, number>;
    agencyMap: Map<string, number>;
    pads: Set<string>;
    firstDate: string;
    latestDate: string;
  }>();

  for (const r of records) {
    const site = r.launch_site || 'Unknown';
    const entry = map.get(site) || {
      total: 0,
      success: 0,
      failure: 0,
      countryMap: new Map<string, number>(),
      vehicleMap: new Map<string, number>(),
      agencyMap: new Map<string, number>(),
      pads: new Set<string>(),
      firstDate: r.date,
      latestDate: r.date
    };

    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    const country = r.site_country || r.launch_country || '';
    if (country) {
      entry.countryMap.set(country, (entry.countryMap.get(country) || 0) + 1);
    }
    if (r.launch_vehicle) {
      entry.vehicleMap.set(r.launch_vehicle, (entry.vehicleMap.get(r.launch_vehicle) || 0) + 1);
    }
    if (r.agency) {
      entry.agencyMap.set(r.agency, (entry.agencyMap.get(r.agency) || 0) + 1);
    }
    if (r.launch_pad) {
      entry.pads.add(r.launch_pad);
    }
    if (r.date) {
      if (!entry.firstDate || r.date < entry.firstDate) entry.firstDate = r.date;
      if (!entry.latestDate || r.date > entry.latestDate) entry.latestDate = r.date;
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

    // Sort top vehicles
    const sortedVehicles = Array.from(item.vehicleMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([v]) => v);

    // Sort top agencies
    const sortedAgencies = Array.from(item.agencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a);

    const coords = VERIFIED_LAUNCH_SITE_COORDINATES[siteName] ?? null;

    result.push({
      siteName,
      country: topCountry,
      totalLaunches: item.total,
      successful: item.success,
      failed: item.failure,
      successRate: item.total > 0 ? Number(((item.success / item.total) * 100).toFixed(1)) : 0,
      coordinates: coords,
      verified: coords !== null,
      primaryVehicles: sortedVehicles,
      primaryAgencies: sortedAgencies,
      pads: Array.from(item.pads).slice(0, 6),
      firstLaunchDate: item.firstDate,
      latestLaunchDate: item.latestDate
    });
  }

  result.sort((a, b) => b.totalLaunches - a.totalLaunches);
  return result;
}

/**
 * Filter missions specifically originating from a given launch site.
 */
export function getMissionsForSite(
  records: CleanedMissionRecord[],
  siteName: string,
  limit = 10
): CleanedMissionRecord[] {
  const normalized = siteName.toLowerCase().trim();
  const matched = records.filter(r => 
    r.launch_site.toLowerCase().trim() === normalized ||
    r.launch_site.toLowerCase().includes(normalized) ||
    normalized.includes(r.launch_site.toLowerCase())
  );
  return matched.slice(0, limit);
}

/**
 * 8. Column Missing-Value and Distinct-Value Profiling for all 19 columns
 * Includes numeric min/max/mean/median and categorical frequency distributions.
 */
export function calculateColumnProfiles(records: CleanedMissionRecord[]): ColumnProfileStat[] {
  const columns: Array<{ field: keyof CleanedMissionRecord; inferredType: string; isNumeric: boolean }> = [
    { field: 'launch_tag', inferredType: 'string (UUID/Identifier)', isNumeric: false },
    { field: 'date', inferredType: 'date (YYYY-MM-DD)', isNumeric: false },
    { field: 'time_utc', inferredType: 'string (HH:MM:SS)', isNumeric: false },
    { field: 'year', inferredType: 'int64', isNumeric: true },
    { field: 'launch_vehicle', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'flight', inferredType: 'string', isNumeric: false },
    { field: 'mission', inferredType: 'string', isNumeric: false },
    { field: 'launch_site', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'launch_pad', inferredType: 'string', isNumeric: false },
    { field: 'site_country', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'agency', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'launch_country', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'launch_class', inferredType: 'string (Enum: Orbital | Deep space)', isNumeric: false },
    { field: 'outcome', inferredType: 'string (Enum: Success | Failure)', isNumeric: false },
    { field: 'launch_code', inferredType: 'string (Categorical)', isNumeric: false },
    { field: 'apogee_km', inferredType: 'float64', isNumeric: true },
    { field: 'perigee_km', inferredType: 'float64', isNumeric: true },
    { field: 'inclination_deg', inferredType: 'float64', isNumeric: true },
    { field: 'payload_mass_t', inferredType: 'float64', isNumeric: true }
  ];

  const total = records.length;

  return columns.map(({ field, inferredType, isNumeric }) => {
    let nonNullCount = 0;
    const distinctSet = new Set<string | number>();
    const samples: (string | number | null)[] = [];
    const numValues: number[] = [];
    const freqMap = new Map<string, number>();

    for (let i = 0; i < total; i++) {
      const val = records[i][field];
      if (val !== null && val !== undefined && val !== '') {
        nonNullCount++;
        distinctSet.add(val);
        if (samples.length < 3 && !samples.includes(val)) {
          samples.push(val);
        }

        if (isNumeric && typeof val === 'number' && !isNaN(val)) {
          numValues.push(val);
        } else {
          const str = String(val);
          freqMap.set(str, (freqMap.get(str) || 0) + 1);
        }
      }
    }

    const nullCount = total - nonNullCount;
    const missingPercent = total > 0 ? Number(((nullCount / total) * 100).toFixed(2)) : 0;

    let min: number | null = null;
    let max: number | null = null;
    let mean: number | null = null;
    let median: number | null = null;

    if (isNumeric && numValues.length > 0) {
      numValues.sort((a, b) => a - b);
      min = numValues[0];
      max = numValues[numValues.length - 1];
      const sum = numValues.reduce((s, v) => s + v, 0);
      mean = Number((sum / numValues.length).toFixed(2));
      median = numValues[Math.floor(numValues.length / 2)];
    }

    const topValues = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([value, count]) => ({ value, count }));

    return {
      field,
      inferredType,
      totalCount: total,
      nonNullCount,
      nullCount,
      missingPercent,
      distinctCount: distinctSet.size,
      sampleValues: samples,
      isNumeric,
      min,
      max,
      mean,
      median,
      topValues: !isNumeric ? topValues : undefined
    };
  });
}

/**
 * 19. Export Cleaned or Filtered Mission Records to RFC 4180 Valid CSV
 */
export function exportRecordsToCSV(records: CleanedMissionRecord[]): string {
  const headers: Array<keyof CleanedMissionRecord> = [
    'launch_tag',
    'date',
    'time_utc',
    'year',
    'launch_vehicle',
    'flight',
    'mission',
    'launch_site',
    'launch_pad',
    'site_country',
    'agency',
    'launch_country',
    'launch_class',
    'outcome',
    'launch_code',
    'apogee_km',
    'perigee_km',
    'inclination_deg',
    'payload_mass_t'
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines: string[] = [headers.join(',')];
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const row = headers.map(h => escapeCSV(r[h]));
    lines.push(row.join(','));
  }

  return lines.join('\r\n');
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

/**
 * 10. Extract deep operational profile for a sovereign state.
 */
export function getCountryDeepProfile(
  records: CleanedMissionRecord[],
  countryName: string
): CountryDeepProfile | null {
  if (!countryName || records.length === 0) return null;
  const norm = countryName.toLowerCase().trim();

  const matched = records.filter(r => 
    r.launch_country && (
      r.launch_country.toLowerCase().trim() === norm ||
      (norm.includes('russia') && r.launch_country.toLowerCase().includes('russia')) ||
      (norm.includes('ussr') && r.launch_country.toLowerCase().includes('ussr')) ||
      (norm.includes('united states') && r.launch_country.toLowerCase().includes('usa')) ||
      (norm.includes('usa') && r.launch_country.toLowerCase().includes('usa'))
    )
  );

  if (matched.length === 0) return null;

  let successful = 0;
  let failed = 0;
  let firstYear = Infinity;
  let latestYear = -Infinity;

  const vehicleMap = new Map<string, { count: number; success: number }>();
  const agencyMap = new Map<string, { count: number; success: number }>();
  const yearMap = new Map<number, { total: number; success: number; failure: number }>();

  for (let i = 0; i < matched.length; i++) {
    const r = matched[i];
    if (r.outcome === 'Success') successful++;
    else if (r.outcome === 'Failure') failed++;

    if (r.year < firstYear) firstYear = r.year;
    if (r.year > latestYear) latestYear = r.year;

    // Vehicle breakdown
    const vName = r.launch_vehicle || 'Unknown Vehicle';
    const vEntry = vehicleMap.get(vName) || { count: 0, success: 0 };
    vEntry.count++;
    if (r.outcome === 'Success') vEntry.success++;
    vehicleMap.set(vName, vEntry);

    // Agency breakdown
    const aName = r.agency || 'Unknown Agency';
    const aEntry = agencyMap.get(aName) || { count: 0, success: 0 };
    aEntry.count++;
    if (r.outcome === 'Success') aEntry.success++;
    agencyMap.set(aName, aEntry);

    // Yearly cadence
    const yEntry = yearMap.get(r.year) || { total: 0, success: 0, failure: 0 };
    yEntry.total++;
    if (r.outcome === 'Success') yEntry.success++;
    else if (r.outcome === 'Failure') yEntry.failure++;
    yearMap.set(r.year, yEntry);
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

  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
  const yearlyCadence: YearCadenceStat[] = sortedYears.map(yr => {
    const y = yearMap.get(yr)!;
    return {
      year: yr,
      total: y.total,
      success: y.success,
      failure: y.failure,
      successRate: y.total > 0 ? Number(((y.success / y.total) * 100).toFixed(1)) : 0
    };
  });

  const total = matched.length;
  const successRate = total > 0 ? Number(((successful / total) * 100).toFixed(1)) : 0;
  const shareOfGlobal = records.length > 0 ? Number(((total / records.length) * 100).toFixed(2)) : 0;

  // Recent missions, sorted descending by date/year
  const recentMissions = [...matched]
    .sort((a, b) => (b.date || `${b.year}`).localeCompare(a.date || `${a.year}`))
    .slice(0, 15);

  return {
    country: matched[0].launch_country,
    code: COUNTRY_CODE_MAP[matched[0].launch_country] || matched[0].launch_country.slice(0, 3).toUpperCase(),
    total,
    successful,
    failed,
    successRate,
    shareOfGlobal,
    firstYear: firstYear === Infinity ? null : firstYear,
    latestYear: latestYear === -Infinity ? null : latestYear,
    topVehicles,
    topAgencies,
    yearlyCadence,
    recentMissions,
    // Statistical validity check: small sample (< 20 flights) has high variance
    isSmallSample: total < 20
  };
}

/**
 * 11. Extract missions for a given year with optional limit and sorting.
 */
export function getMissionsForYear(
  records: CleanedMissionRecord[],
  year: number,
  limit = 200
): CleanedMissionRecord[] {
  const filtered = records.filter(r => r.year === year);
  // Sort descending by date
  filtered.sort((a, b) => (b.date || `${b.year}`).localeCompare(a.date || `${a.year}`));
  return limit > 0 ? filtered.slice(0, limit) : filtered;
}

/**
 * 12. Multidimensional filtering for missions.
 */
export function filterMissions(
  records: CleanedMissionRecord[],
  filters: {
    country?: string;
    vehicle?: string;
    outcome?: string;
    year?: number | null;
    searchQuery?: string;
  }
): CleanedMissionRecord[] {
  return records.filter(r => {
    if (filters.year !== undefined && filters.year !== null && r.year !== filters.year) {
      return false;
    }
    if (filters.country && filters.country !== 'All' && r.launch_country !== filters.country) {
      return false;
    }
    if (filters.vehicle && filters.vehicle !== 'All' && r.launch_vehicle !== filters.vehicle) {
      return false;
    }
    if (filters.outcome && filters.outcome !== 'All' && r.outcome !== filters.outcome) {
      return false;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchMission = r.mission?.toLowerCase().includes(q) ?? false;
      const matchVehicle = r.launch_vehicle.toLowerCase().includes(q);
      const matchTag = r.launch_tag.toLowerCase().includes(q);
      const matchSite = r.launch_site.toLowerCase().includes(q);
      const matchAgency = r.agency.toLowerCase().includes(q);
      const matchCountry = r.launch_country.toLowerCase().includes(q);
      if (!matchMission && !matchVehicle && !matchTag && !matchSite && !matchAgency && !matchCountry) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 13. Find peak launch years in history.
 */
export function getPeakLaunchYears(
  cadence: YearCadenceStat[],
  topN = 5
): YearCadenceStat[] {
  return [...cadence].sort((a, b) => b.total - a.total).slice(0, topN);
}

/**
 * 14. Payload Mass Distribution and Aggregation Analytics
 * Safely handles missing/null payload masses without treating them as zero.
 */
export function calculatePayloadMassStats(records: CleanedMissionRecord[]): PayloadMassStats {
  const valid = records.filter(r => r.payload_mass_t !== null && r.payload_mass_t !== undefined);
  if (valid.length === 0) {
    return {
      totalMassT: 0,
      averageMassT: 0,
      medianMassT: 0,
      maxMassT: 0,
      validCount: 0,
      topHeaviestMissions: [],
      massBuckets: [],
      countryMassBreakdown: []
    };
  }

  const sorted = [...valid].sort((a, b) => (a.payload_mass_t || 0) - (b.payload_mass_t || 0));
  const total = sorted.reduce((sum, r) => sum + (r.payload_mass_t || 0), 0);
  const avg = total / sorted.length;
  const med = sorted[Math.floor(sorted.length / 2)].payload_mass_t || 0;
  const max = sorted[sorted.length - 1].payload_mass_t || 0;

  // 5 standardized payload mass lift classes
  const buckets = [
    { category: 'CubeSat / MicroSat', rangeLabel: '< 1.0 t', min: 0, max: 1.0, color: '#39D5F2', count: 0 },
    { category: 'Light Lift Class', rangeLabel: '1.0 – 5.0 t', min: 1.0, max: 5.0, color: '#10B981', count: 0 },
    { category: 'Medium Lift Class', rangeLabel: '5.0 – 15.0 t', min: 5.0, max: 15.0, color: '#648CFF', count: 0 },
    { category: 'Heavy Lift Class', rangeLabel: '15.0 – 50.0 t', min: 15.0, max: 50.0, color: '#A78BFA', count: 0 },
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

  // Country payload mass breakdown
  const cMap = new Map<string, { totalMass: number; count: number; maxMass: number }>();
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
    .sort((a, b) => b.totalMassT - a.totalMassT)
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

/**
 * 15. Orbital / Trajectory Altitude & Inclination Analytics
 * Excludes missing/null orbital parameters from calculations.
 */
export function calculateOrbitalTrajectoryStats(records: CleanedMissionRecord[]): OrbitalTrajectoryStats {
  // Apogee
  const validApogee = records
    .filter(r => r.apogee_km !== null && r.apogee_km !== undefined && !isNaN(r.apogee_km))
    .map(r => r.apogee_km as number)
    .sort((a, b) => a - b);

  let apogeeMedian = 0;
  let apogeeAvg = 0;
  let apogeeMax = 0;
  let apogeeMin = 0;
  const apogeeRegimes = [
    { regime: 'Low Earth Orbit (LEO)', range: '< 2,000 km', count: 0, percent: 0 },
    { regime: 'Medium Earth Orbit (MEO)', range: '2,000 – 30,000 km', count: 0, percent: 0 },
    { regime: 'Geostationary / GTO', range: '30,000 – 40,000 km', count: 0, percent: 0 },
    { regime: 'High Elliptic / Deep Space', range: '> 40,000 km', count: 0, percent: 0 }
  ];

  if (validApogee.length > 0) {
    apogeeMedian = validApogee[Math.floor(validApogee.length / 2)];
    apogeeAvg = validApogee.reduce((sum, v) => sum + v, 0) / validApogee.length;
    apogeeMax = validApogee[validApogee.length - 1];
    apogeeMin = validApogee[0];

    validApogee.forEach(ap => {
      if (ap < 2000) apogeeRegimes[0].count++;
      else if (ap >= 2000 && ap < 30000) apogeeRegimes[1].count++;
      else if (ap >= 30000 && ap <= 40000) apogeeRegimes[2].count++;
      else apogeeRegimes[3].count++;
    });

    apogeeRegimes.forEach(r => {
      r.percent = Number(((r.count / validApogee.length) * 100).toFixed(1));
    });
  }

  // Perigee
  const validPerigee = records
    .filter(r => r.perigee_km !== null && r.perigee_km !== undefined && !isNaN(r.perigee_km))
    .map(r => r.perigee_km as number)
    .sort((a, b) => a - b);

  let perigeeMedian = 0;
  let perigeeAvg = 0;
  let perigeeMax = 0;
  let perigeeMin = 0;

  if (validPerigee.length > 0) {
    perigeeMedian = validPerigee[Math.floor(validPerigee.length / 2)];
    perigeeAvg = validPerigee.reduce((sum, v) => sum + v, 0) / validPerigee.length;
    perigeeMax = validPerigee[validPerigee.length - 1];
    perigeeMin = validPerigee[0];
  }

  // Inclination
  const validInc = records
    .filter(r => r.inclination_deg !== null && r.inclination_deg !== undefined && !isNaN(r.inclination_deg))
    .map(r => r.inclination_deg as number)
    .sort((a, b) => a - b);

  let incMedian = 0;
  const incClusters = [
    { name: 'Equatorial / Near-Equator', band: '< 20°', count: 0, percent: 0, description: 'Direct eastward launches from Kourou & San Marco' },
    { name: 'Cape Canaveral Corridor', band: '20°–35°', count: 0, percent: 0, description: 'Florida Kennedy & Canaveral standard ~28.5° launches' },
    { name: 'Mid-Latitude / ISS Standard', band: '45°–55°', count: 0, percent: 0, description: 'Baikonur Cosmodrome & International Space Station ~51.6°' },
    { name: 'Molniya / Russian High-Latitude', band: '60°–75°', count: 0, percent: 0, description: 'Plesetsk high-apogee northern hemisphere coverage ~63.4°' },
    { name: 'Sun-Synchronous & Polar', band: '80°–105°', count: 0, percent: 0, description: 'Vandenberg, Jiuquan, & Taiyuan polar Earth observation ~97-98°' },
    { name: 'Retrograde Trajectories', band: '> 105°', count: 0, percent: 0, description: 'Westward orbital insertion (e.g. Israeli Shavit Mediterranean flights)' }
  ];

  if (validInc.length > 0) {
    incMedian = validInc[Math.floor(validInc.length / 2)];

    validInc.forEach(inc => {
      if (inc < 20) incClusters[0].count++;
      else if (inc >= 20 && inc < 35) incClusters[1].count++;
      else if (inc >= 45 && inc < 55) incClusters[2].count++;
      else if (inc >= 60 && inc < 75) incClusters[3].count++;
      else if (inc >= 80 && inc <= 105) incClusters[4].count++;
      else if (inc > 105) incClusters[5].count++;
    });

    incClusters.forEach(c => {
      c.percent = Number(((c.count / validInc.length) * 100).toFixed(1));
    });
  }

  // Apogee vs Perigee paired scatter sample
  const pairedMissions = records.filter(r => 
    r.apogee_km !== null && r.apogee_km !== undefined &&
    r.perigee_km !== null && r.perigee_km !== undefined
  );

  const step = Math.max(1, Math.floor(pairedMissions.length / 100));
  const scatterSample = pairedMissions
    .filter((_, idx) => idx % step === 0)
    .slice(0, 100)
    .map(r => ({
      apogeeKm: r.apogee_km as number,
      perigeeKm: r.perigee_km as number,
      inclinationDeg: r.inclination_deg,
      mission: r.mission || r.flight || r.launch_vehicle,
      vehicle: r.launch_vehicle,
      launchClass: r.launch_class,
      outcome: r.outcome,
      year: r.year
    }));

  return {
    apogee: {
      validCount: validApogee.length,
      medianKm: Number(apogeeMedian.toFixed(1)),
      avgKm: Number(apogeeAvg.toFixed(1)),
      maxKm: Number(apogeeMax.toFixed(1)),
      minKm: Number(apogeeMin.toFixed(1)),
      regimes: apogeeRegimes
    },
    perigee: {
      validCount: validPerigee.length,
      medianKm: Number(perigeeMedian.toFixed(1)),
      avgKm: Number(perigeeAvg.toFixed(1)),
      maxKm: Number(perigeeMax.toFixed(1)),
      minKm: Number(perigeeMin.toFixed(1))
    },
    inclination: {
      validCount: validInc.length,
      medianDeg: Number(incMedian.toFixed(1)),
      clusters: incClusters
    },
    scatterSample
  };
}

/**
 * 16. Mission Classification Analytics (Orbital vs Deep Space)
 */
export function calculateMissionClassStats(records: CleanedMissionRecord[]): MissionClassStats {
  const total = records.length;
  let orbCount = 0;
  let orbSuccess = 0;
  let orbFail = 0;
  let orbMassTotal = 0;
  let orbMassCount = 0;

  let deepCount = 0;
  let deepSuccess = 0;
  let deepFail = 0;
  let deepMassTotal = 0;
  let deepMassCount = 0;

  records.forEach(r => {
    const isOrb = r.launch_class === 'Orbital';
    const isSuccess = r.outcome === 'Success';
    const m = r.payload_mass_t;

    if (isOrb) {
      orbCount++;
      if (isSuccess) orbSuccess++;
      else orbFail++;
      if (m !== null && m !== undefined) {
        orbMassTotal += m;
        orbMassCount++;
      }
    } else {
      deepCount++;
      if (isSuccess) deepSuccess++;
      else deepFail++;
      if (m !== null && m !== undefined) {
        deepMassTotal += m;
        deepMassCount++;
      }
    }
  });

  return {
    orbital: {
      count: orbCount,
      percent: total > 0 ? Number(((orbCount / total) * 100).toFixed(1)) : 0,
      success: orbSuccess,
      failure: orbFail,
      successRate: orbCount > 0 ? Number(((orbSuccess / orbCount) * 100).toFixed(1)) : 0,
      totalMassT: Number(orbMassTotal.toFixed(1)),
      avgMassT: orbMassCount > 0 ? Number((orbMassTotal / orbMassCount).toFixed(2)) : 0
    },
    deepSpace: {
      count: deepCount,
      percent: total > 0 ? Number(((deepCount / total) * 100).toFixed(1)) : 0,
      success: deepSuccess,
      failure: deepFail,
      successRate: deepCount > 0 ? Number(((deepSuccess / deepCount) * 100).toFixed(1)) : 0,
      totalMassT: Number(deepMassTotal.toFixed(1)),
      avgMassT: deepMassCount > 0 ? Number((deepMassTotal / deepMassCount).toFixed(2)) : 0
    }
  };
}

/**
 * 17. Launch Vehicle Detailed Performance & Reliability
 */
export function calculateVehicleDetailedStats(
  records: CleanedMissionRecord[],
  topN = 25
): VehicleDetailedStat[] {
  const map = new Map<string, {
    total: number;
    success: number;
    failure: number;
    countryMap: Map<string, number>;
    agencyMap: Map<string, number>;
    totalMass: number;
    massCount: number;
    firstYear: number;
    latestYear: number;
  }>();

  records.forEach(r => {
    const v = r.launch_vehicle || 'Unknown Vehicle';
    const entry = map.get(v) || {
      total: 0,
      success: 0,
      failure: 0,
      countryMap: new Map<string, number>(),
      agencyMap: new Map<string, number>(),
      totalMass: 0,
      massCount: 0,
      firstYear: r.year,
      latestYear: r.year
    };

    entry.total++;
    if (r.outcome === 'Success') entry.success++;
    else if (r.outcome === 'Failure') entry.failure++;

    const country = r.launch_country || r.site_country || '';
    if (country) {
      entry.countryMap.set(country, (entry.countryMap.get(country) || 0) + 1);
    }
    if (r.agency) {
      entry.agencyMap.set(r.agency, (entry.agencyMap.get(r.agency) || 0) + 1);
    }

    if (r.payload_mass_t !== null && r.payload_mass_t !== undefined) {
      entry.totalMass += r.payload_mass_t;
      entry.massCount++;
    }

    if (r.year < entry.firstYear) entry.firstYear = r.year;
    if (r.year > entry.latestYear) entry.latestYear = r.year;

    map.set(v, entry);
  });

  const result: VehicleDetailedStat[] = [];
  for (const [vehicle, d] of map.entries()) {
    let topCountry = 'Global';
    let maxC = 0;
    for (const [c, count] of d.countryMap.entries()) {
      if (count > maxC) {
        maxC = count;
        topCountry = c;
      }
    }

    let topAgency = 'Various';
    let maxA = 0;
    for (const [a, count] of d.agencyMap.entries()) {
      if (count > maxA) {
        maxA = count;
        topAgency = a;
      }
    }

    result.push({
      vehicle,
      total: d.total,
      success: d.success,
      failure: d.failure,
      successRate: d.total > 0 ? Number(((d.success / d.total) * 100).toFixed(1)) : 0,
      primaryCountry: topCountry,
      primaryAgency: topAgency,
      totalMassT: Number(d.totalMass.toFixed(1)),
      avgMassT: d.massCount > 0 ? Number((d.totalMass / d.massCount).toFixed(2)) : 0,
      firstYear: d.firstYear,
      latestYear: d.latestYear,
      // Small sample context: fewer than 10 flights carries high variance
      isSmallSample: d.total < 10
    });
  }

  result.sort((a, b) => b.total - a.total);
  return topN > 0 ? result.slice(0, topN) : result;
}

/**
 * 18. Master Mission Analytics Calculation
 */
export function calculateMissionAnalytics(records: CleanedMissionRecord[]): MissionAnalyticsData {
  return {
    payloadMass: calculatePayloadMassStats(records),
    orbitalTrajectory: calculateOrbitalTrajectoryStats(records),
    missionClass: calculateMissionClassStats(records),
    topVehicles: calculateVehicleDetailedStats(records, 25)
  };
}

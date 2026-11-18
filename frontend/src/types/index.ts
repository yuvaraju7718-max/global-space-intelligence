export type MissionStatus = 'Success' | 'Failure' | 'Partial Failure' | 'Pre-Launch';

export type LaunchOutcome = 'Success' | 'Failure';
export type LaunchClass = 'Orbital' | 'Deep space';

export type MissionType = 
  | 'Earth Observation' 
  | 'Communications' 
  | 'Planetary & Deep Space' 
  | 'Lunar Exploration' 
  | 'Human Spaceflight' 
  | 'Technology Demonstration' 
  | 'Navigation & Positioning' 
  | 'Defense & Reconnaissance';

export type OrbitDestination = 
  | 'LEO' // Low Earth Orbit
  | 'SSO' // Sun-Synchronous Orbit
  | 'MEO' // Medium Earth Orbit
  | 'GEO' // Geostationary Orbit
  | 'GTO' // Geostationary Transfer Orbit
  | 'Lunar' 
  | 'Mars' 
  | 'Interplanetary' 
  | 'Suborbital';

/**
 * 19 Canonical Columns from data/global_space_missions_cleaned.csv
 */
export interface CleanedMissionRecord {
  launch_tag: string;
  date: string;
  time_utc: string | null;
  year: number;
  launch_vehicle: string;
  flight: string | null;
  mission: string | null;
  launch_site: string;
  launch_pad: string | null;
  site_country: string;
  agency: string;
  launch_country: string;
  launch_class: LaunchClass;
  outcome: LaunchOutcome;
  launch_code: string;
  apogee_km: number | null;
  perigee_km: number | null;
  inclination_deg: number | null;
  payload_mass_t: number | null;
}

/**
 * Statistical Aggregation Types
 */
export interface DatasetSummaryStats {
  totalLaunches: number;
  successfulLaunches: number;
  failedLaunches: number;
  successRate: number;
  orbitalMissions: number;
  deepSpaceMissions: number;
  uniqueCountries: number;
  uniqueAgencies: number;
  uniqueVehicles: number;
  uniqueLaunchSites: number;
  yearMin: number;
  yearMax: number;
}

export interface YearCadenceStat {
  year: number;
  total: number;
  success: number;
  failure: number;
  successRate: number;
}

export interface DecadeCadenceStat {
  decade: string;
  total: number;
  success: number;
  failure: number;
  successRate: number;
}

export interface CountryAggStat {
  country: string;
  code?: string;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  shareOfGlobal: number;
  firstLaunchYear: number;
  latestLaunchYear: number;
}

export interface AgencyRankingStat {
  agency: string;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  primaryCountry: string;
}

export interface VehicleRankingStat {
  vehicle: string;
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  primaryAgency?: string;
}

export interface LaunchSiteFreqStat {
  siteName: string;
  country: string;
  totalLaunches: number;
  successful: number;
  failed: number;
  successRate: number;
  coordinates: [number, number] | null; // null if unverified/sea
  verified: boolean;
}

export interface ColumnProfileStat {
  field: string;
  inferredType: string;
  totalCount: number;
  nonNullCount: number;
  nullCount: number;
  missingPercent: number;
  distinctCount: number;
  sampleValues: (string | number | null)[];
}

export interface GlobalSpaceAnalytics {
  summary: DatasetSummaryStats;
  yearCadence: YearCadenceStat[];
  decadeCadence: DecadeCadenceStat[];
  countryStats: CountryAggStat[];
  agencyRankings: AgencyRankingStat[];
  vehicleRankings: VehicleRankingStat[];
  launchSiteStats: LaunchSiteFreqStat[];
  columnProfiles: ColumnProfileStat[];
}

export interface SpaceMission {
  id: string;
  name: string;
  agency: string;
  country: string;
  launchSite: string;
  launchDate: string;
  year: number;
  decade: string;
  vehicle: string;
  payloadType: MissionType;
  payloadMassKg?: number;
  orbit: OrbitDestination;
  status: MissionStatus;
  costMillionUSD?: number;
  details: string;
  coordinates: [number, number]; // [lat, lng]
}

export interface LaunchSite {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [latitude, longitude]
  operationalSince: number;
  totalLaunches: number;
  successRate: number;
  primaryOperators: string[];
  description: string;
  notablePads: string[];
}

export interface SpaceAgency {
  id: string;
  name: string;
  acronym: string;
  country: string;
  founded: number;
  totalMissions: number;
  successRate: number;
  primaryVehicles: string[];
  type: 'Government' | 'Commercial' | 'International';
  status: 'Active' | 'Historical';
}

export interface CountryStat {
  country: string;
  code: string;
  totalMissions: number;
  successful: number;
  failed: number;
  successRate: number;
  firstLaunchYear: number;
  activeAgencies: number;
  shareOfGlobal: number;
}

export interface TimelineMilestone {
  year: number;
  date: string;
  title: string;
  agency: string;
  country: string;
  vehicle: string;
  description: string;
  significance: 'Historic First' | 'Exploration' | 'Technological Leap' | 'Deep Space';
  iconType: string;
}

export interface FilterState {
  searchQuery: string;
  yearRange: [number, number];
  selectedCountry: string;
  selectedAgency: string;
  selectedType: string;
  selectedStatus: string;
}

export interface MLPredictionInput {
  launchSite: string;
  country: string;
  vehicleClass: string;
  orbit: string;
  payloadType: string;
  payloadMassCategory: string;
  launchMonth: number;
  agencyType: string;
  preLaunchWeatherRisk: string;
}

export interface MLPredictionResult {
  predictedStatus: 'Success' | 'Failure';
  confidenceScore: number;
  probabilityDistribution: {
    success: number;
    failure: number;
    partial: number;
  };
  topInfluencingFeatures: Array<{ feature: string; impact: string; weight: number }>;
  modelMeta: {
    modelType: string;
    version: string;
    trainingDate: string;
    leakageFreeVerified: boolean;
  };
}

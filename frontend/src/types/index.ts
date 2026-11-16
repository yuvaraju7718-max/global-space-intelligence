export type MissionStatus = 'Success' | 'Failure' | 'Partial Failure' | 'Pre-Launch';

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

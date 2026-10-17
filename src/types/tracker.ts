export interface GeoLocation {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postal?: string;
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters (from GPS)
  isGps: boolean;
  timezone?: string;
  isp?: string;
  org?: string;
  asn?: string;
  isVpnOrProxy?: boolean;
}

export interface DeviceTelemetry {
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
  os: string;
  osVersion?: string;
  browser: string;
  browserVersion?: string;
  screenResolution: string;
  colorDepth?: number;
  orientation?: string;
  language: string;
  languages?: string[];
  batteryLevel?: number;
  isCharging?: boolean;
  cpuCores?: number;
  deviceMemoryGb?: number;
  connectionType?: string;
  gpuRenderer?: string;
  userAgent: string;
}

export interface OpenerVisit {
  id: string;
  linkId: string;
  linkTitle: string;
  timestamp: string;
  lastPingTimestamp?: string;
  dwellTimeSeconds: number;
  isOnline: boolean;
  geo: GeoLocation;
  device: DeviceTelemetry;
  referrer: string;
  destinationUrl?: string;
  notes?: string;
}

export interface TrackingLink {
  id: string;
  slug: string;
  title: string;
  targetUrl: string;
  decoyType: 'instant' | 'verify' | 'cloud_file' | 'meeting' | 'status';
  customPromptMessage?: string;
  createdAt: string;
  visitsCount: number;
  lastVisitAt?: string;
  active: boolean;
}

export interface TrackerStats {
  totalVisits: number;
  uniqueIps: number;
  activeNow: number;
  gpsCapturedRate: number;
  topCountry: string;
  topDevice: string;
}

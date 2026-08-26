export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type TravelMode = 'WALK' | 'DRIVE';

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface CalculatedRoute {
  mode: TravelMode;
  start: LatLngLiteral;
  startLabel?: string;
  end: LatLngLiteral;
  endLabel?: string;
  distanceMeters: number;
  durationSeconds: number;
  polyline: [number, number][]; // [lat, lng] points for drawing
  steps?: RouteStep[];
}

export interface GeocodeV4Location {
  latitude: number;
  longitude: number;
}

export interface GeocodeV4Viewport {
  low: GeocodeV4Location;
  high: GeocodeV4Location;
}

export interface GeocodeV4AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode?: string;
}

export interface GeocodeV4Result {
  place?: string;
  placeId?: string;
  formattedAddress?: string;
  location?: GeocodeV4Location;
  granularity?: string;
  viewport?: GeocodeV4Viewport;
  bounds?: GeocodeV4Viewport;
  types?: string[];
  addressComponents?: GeocodeV4AddressComponent[];
  plusCode?: {
    globalCode?: string;
    compoundCode?: string;
  };
}

export interface GeocodedLocationData {
  query: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId?: string;
  granularity?: string;
  viewport?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  types?: string[];
  components?: GeocodeV4AddressComponent[];
  isPreset?: boolean;
  isFallback?: boolean;
  timestamp: number;
}

export interface PresetLocation {
  id: string;
  name: string;
  sublabel: string;
  query: string;
  lat: number;
  lng: number;
  zoom: number;
  country: string;
  tag: string;
  iconName: string;
  highlights: string[];
  description: string;
}

export interface ApiErrorInfo {
  code: number | string;
  status?: string;
  message: string;
  endpoint?: string;
  timestamp: number;
  troubleshooting?: {
    step1?: string;
    step2?: string;
    step3?: string;
  };
  rawDetails?: any;
}

export type MapTypeStyle = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

export interface YouthDiscoveryItem {
  id: string;
  name: string;
  type: 'youth_center' | 'free_event' | 'teen_room' | 'maker_space' | 'sports_rec' | 'arts_culture';
  county: 'king' | 'snohomish' | 'other';
  city: string;
  description: string;
  freeDetails: string;
  ageGroup: string;
  address: string;
  lat: number;
  lng: number;
  transitAccess: string;
  scheduleOrDate: string;
  scoutPoints: number;
  tags: string[];
  contactOrLink?: string;
  verifiedFree: boolean;
}

export type GeocacheSize = 'Micro' | 'Small' | 'Regular' | 'Large' | 'Mystery';

export interface GeocacheItem {
  id: string;
  name: string;
  county: 'king' | 'snohomish';
  city: string;
  lat: number;
  lng: number;
  difficulty: number; // 1-5
  terrain: number; // 1-5
  size: GeocacheSize;
  clue: string;
  hint: string;
  secretCode: string;
  virtualSwag: string[];
  nearestTransit: string;
  xpReward: number;
  description: string;
  createdBy?: string;
  isCustom?: boolean;
}

export interface GeocacheLog {
  cacheId: string;
  cacheName: string;
  timestamp: number;
  swagTradedIn?: string;
  swagTaken?: string;
  userNote?: string;
  xpEarned: number;
}

export interface GeocacheBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  isUnlocked: boolean;
}

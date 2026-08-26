export interface TransitStop {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  lines: string[];
  type: 'light-rail' | 'bus-rapid' | 'bus-local';
}

export interface TransitArrival {
  routeId: string;
  shortName: string;
  headsign: string;
  minutes: number;
  isLive: boolean;
  color?: string;
}

export interface CommunityPlace {
  id: string;
  name: string;
  category: 'museum' | 'park' | 'library' | 'community-center' | 'school';
  address: string;
  lat: number;
  lng: number;
  verified: boolean;
  freeAdmission: boolean;
  description: string;
  nearestStopId: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  placeId: string;
  when: string;
  blurb: string;
  verified: boolean;
  category: string;
  points: number;
}

export interface HowToRideStep {
  title: string;
  body: string;
}

export interface TransitLineRoute {
  id: string;
  name: string;
  type: 'train' | 'bus';
  color: string;
  coordinates: [number, number][];
}

export const TRANSIT_NETWORK_LINES: TransitLineRoute[] = [
  {
    id: 'link-1-line',
    name: '1-Line (Link Light Rail)',
    type: 'train',
    color: '#16a34a',
    coordinates: [
      [47.5985, -122.3280], // Chinatown
      [47.6015, -122.3315], // Pioneer Square
      [47.6067, -122.3325], // University St / Central Lib
      [47.6114, -122.3370], // Westlake
      [47.6195, -122.3207], // Capitol Hill
    ],
  },
  {
    id: 'rapidride-c',
    name: 'RapidRide C Line',
    type: 'bus',
    color: '#ea580c',
    coordinates: [
      [47.6114, -122.3370], // Westlake
      [47.6166, -122.3553], // Olympic Sculpture Park
      [47.6219, -122.3486], // Seattle Center
    ],
  },
  {
    id: 'route-48',
    name: 'Route 48 (Central District Link)',
    type: 'bus',
    color: '#d97706',
    coordinates: [
      [47.5985, -122.3280], // Chinatown
      [47.6019, -122.3195], // Yesler Center
      [47.6062, -122.3021], // Garfield HS
      [47.6195, -122.3207], // Capitol Hill
    ],
  },
  {
    id: 'route-7',
    name: 'Route 7 (Rainier Ave)',
    type: 'bus',
    color: '#0284c7',
    coordinates: [
      [47.5985, -122.3280], // Chinatown
      [47.6015, -122.3315], // Pioneer Square
      [47.6067, -122.3325], // Downtown 4th Ave
      [47.6114, -122.3370], // Westlake Hub
    ],
  },
];

// Transit Stops for Seattle Central Core / Youth Transit Zone
export const STOPS: TransitStop[] = [
  {
    id: 'westlake-hub',
    name: 'Westlake Transit Hub',
    code: 'BAY-1',
    lat: 47.6114,
    lng: -122.3370,
    lines: ['1-Line', 'Route 7', 'Route 49', 'RapidRide C'],
    type: 'light-rail',
  },
  {
    id: 'capitol-hill',
    name: 'Capitol Hill Station',
    code: 'BAY-2',
    lat: 47.6195,
    lng: -122.3207,
    lines: ['1-Line', 'Route 8', 'Route 49', 'Route 10'],
    type: 'light-rail',
  },
  {
    id: 'pioneer-sq',
    name: 'Pioneer Square Station',
    code: 'BAY-3',
    lat: 47.6015,
    lng: -122.3315,
    lines: ['1-Line', 'Route 7', 'Route 36', 'Route 70'],
    type: 'light-rail',
  },
  {
    id: 'chinatown-id',
    name: 'Intl District / Chinatown',
    code: 'BAY-4',
    lat: 47.5985,
    lng: -122.3280,
    lines: ['1-Line', 'First Hill SC', 'Route 7'],
    type: 'light-rail',
  },
  {
    id: 'seattle-center-stop',
    name: 'Seattle Center / 5th Ave N',
    code: 'BAY-5',
    lat: 47.6219,
    lng: -122.3486,
    lines: ['Monorail', 'Route 1', 'Route 2', 'Route 33'],
    type: 'bus-rapid',
  },
  {
    id: 'garfield-stop',
    name: '23rd Ave & E Jefferson (Garfield HS)',
    code: 'BAY-6',
    lat: 47.6062,
    lng: -122.3021,
    lines: ['Route 48', 'Route 3', 'Route 4'],
    type: 'bus-local',
  },
];

export const COMMUNITY_PLACES: CommunityPlace[] = [
  {
    id: 'school-garfield',
    name: 'Garfield High School',
    category: 'school',
    address: '400 23rd Ave, Seattle, WA 98122',
    lat: 47.6063,
    lng: -122.3018,
    verified: true,
    freeAdmission: true,
    description: 'Designated youth learning hub with daily check-ins and scout points.',
    nearestStopId: 'garfield-stop',
  },
  {
    id: 'mopop',
    name: 'MoPOP (Museum of Pop Culture)',
    category: 'museum',
    address: '325 5th Ave N, Seattle, WA 98109',
    lat: 47.6215,
    lng: -122.3482,
    verified: true,
    freeAdmission: true,
    description: 'Interactive exhibits on music, gaming, sci-fi and animation with TeenTix free access.',
    nearestStopId: 'seattle-center-stop',
  },
  {
    id: 'central-library',
    name: 'Seattle Central Library',
    category: 'library',
    address: '1000 4th Ave, Seattle, WA 98104',
    lat: 47.6067,
    lng: -122.3325,
    verified: true,
    freeAdmission: true,
    description: 'Iconic 11-story glass spiral library with free high-speed tech labs and study pods.',
    nearestStopId: 'pioneer-sq',
  },
  {
    id: 'olympic-park',
    name: 'Olympic Sculpture Park',
    category: 'park',
    address: '2901 Western Ave, Seattle, WA 98121',
    lat: 47.6166,
    lng: -122.3553,
    verified: true,
    freeAdmission: true,
    description: 'Open 9-acre waterfront park featuring monumental outdoor art and Puget Sound views.',
    nearestStopId: 'westlake-hub',
  },
  {
    id: 'yesler-center',
    name: 'Yesler Community Center',
    category: 'community-center',
    address: '917 E Yesler Way, Seattle, WA 98122',
    lat: 47.6019,
    lng: -122.3195,
    verified: true,
    freeAdmission: true,
    description: 'Free teen drop-in gym, recording studio workshops, and after-school programs.',
    nearestStopId: 'chinatown-id',
  },
];

export const EVENTS: CommunityEvent[] = [
  {
    id: 'event-mopop-teen',
    title: 'TeenTix Free Gallery Night',
    placeId: 'mopop',
    when: 'Thursday · 4:00 PM – 8:00 PM',
    blurb: 'Free admission with teen card. Live DJ workshop, gaming arena, and indie anime screenings.',
    verified: true,
    category: 'Arts & Culture',
    points: 150,
  },
  {
    id: 'event-central-maker',
    title: 'Youth Digital Makerspace',
    placeId: 'central-library',
    when: 'Friday · 3:30 PM – 6:00 PM',
    blurb: '3D printing, podcast recording booths, VR exploration, and robotics mentorship.',
    verified: true,
    category: 'Tech & STEM',
    points: 120,
  },
  {
    id: 'event-yesler-hoops',
    title: 'Open Teen Gym & Skate Session',
    placeId: 'yesler-center',
    when: 'Saturday · 2:00 PM – 6:00 PM',
    blurb: 'Free scrimmage basketball courts, snack lounge, and skate workshop with pro coaches.',
    verified: true,
    category: 'Sports & Active',
    points: 100,
  },
  {
    id: 'event-sculpture-sunset',
    title: 'Sound & Sunset Photography Walk',
    placeId: 'olympic-park',
    when: 'Sunday · 5:30 PM – 7:30 PM',
    blurb: 'Guided mobile photography walk along the sculpture pavilions as the sun sets over Elliott Bay.',
    verified: true,
    category: 'Outdoors',
    points: 90,
  },
];

export const HOW_TO_RIDE: HowToRideStep[] = [
  {
    title: 'Hop on any Bus, Link Light Rail, or Streetcar',
    body: 'Transit is 100% free for all youth age 18 and under across the entire Puget Sound region.',
  },
  {
    title: 'Tap your Youth ORCA if you have one',
    body: 'If you have a card, tap it at the reader. If you forgot or lost your card, just board anyway — zero fare is required.',
  },
  {
    title: 'Track your ride and earn Scout points',
    body: 'Start Ride Mode in the app to follow your route in real-time, get arrival alerts, and check in at school or verified community hubs.',
  },
];

export function placeById(id: string): CommunityPlace | undefined {
  return COMMUNITY_PLACES.find((p) => p.id === id);
}

export function stopById(id: string): TransitStop | undefined {
  return STOPS.find((s) => s.id === id);
}

/**
 * Generates live dynamic arrivals for a stop based on current time
 */
export function arrivalsForStop(stop: TransitStop, now: Date): TransitArrival[] {
  const seed = (stop.name.charCodeAt(0) + stop.name.length * 7 + now.getMinutes()) % 60;
  const seconds = now.getSeconds();

  const mockLines = [
    { shortName: '1-Line', headsign: 'Northgate / Lynnwood Link', color: '#16a34a', baseMin: 2 },
    { shortName: 'Route 7', headsign: 'Rainier Beach via Columbia City', color: '#0284c7', baseMin: 5 },
    { shortName: 'Route 49', headsign: 'U-District Station via Broadway', color: '#9333ea', baseMin: 9 },
    { shortName: 'RapidRide C', headsign: 'West Seattle / Westwood Village', color: '#ea580c', baseMin: 14 },
    { shortName: 'Route 48', headsign: 'Loyal Heights via Montlake & UW', color: '#d97706', baseMin: 18 },
  ];

  return mockLines.map((line, idx) => {
    // Dynamic countdown calculation
    const cycle = (seed + idx * 7) % 20;
    let minutesLeft = Math.max(0, cycle - Math.floor(seconds / 20) + line.baseMin);
    const isLive = idx % 2 === 0 || minutesLeft < 6;

    return {
      routeId: `${stop.id}-${line.shortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      shortName: line.shortName,
      headsign: line.headsign,
      minutes: minutesLeft,
      isLive,
      color: line.color,
    };
  }).sort((a, b) => a.minutes - b.minutes);
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) {
    return 'Due';
  }
  if (minutes === 1) {
    return '1 min';
  }
  return `${minutes} mins`;
}

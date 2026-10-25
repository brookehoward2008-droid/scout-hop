import { GeocacheBadge, GeocacheItem } from '../types';

export const INITIAL_GEOCACHES: GeocacheItem[] = [];

export const INITIAL_GEOCACHE_BADGES: GeocacheBadge[] = [
  {
    id: 'badge-first-find',
    title: 'First Geocache Found',
    description: 'Discovered and logged your very first digital geocache!',
    icon: 'target',
    isUnlocked: false,
  },
  {
    id: 'badge-link-rider',
    title: 'Transit Trekker',
    description: 'Found 3 or more geocaches accessible via Link Light Rail & Swift buses.',
    icon: 'train',
    isUnlocked: false,
  },
  {
    id: 'badge-king-explorer',
    title: 'King County Scout',
    description: 'Logged 2 geocaches located in King County.',
    icon: 'crown',
    isUnlocked: false,
  },
  {
    id: 'badge-snoho-trailblazer',
    title: 'Snohomish Trailblazer',
    description: 'Logged 2 geocaches located in Snohomish County.',
    icon: 'trees',
    isUnlocked: false,
  },
  {
    id: 'badge-swag-trader',
    title: 'Master Swag Trader',
    description: 'Left virtual swag items in 3 different cache logbooks.',
    icon: 'gift',
    isUnlocked: false,
  },
  {
    id: 'badge-cache-creator',
    title: 'Cache Master Architect',
    description: 'Created and placed your own custom geocache on the interactive map.',
    icon: 'map-pin',
    isUnlocked: false,
  },
];

export const DEFAULT_USER_SWAG_INVENTORY = [
  'Vintage 1990 ORCA Token',
  'Glowing Emerald Crystal',
  'Mini Solar Compass',
  'Golden Seattle Space Needle Pin',
  'Origami Transit Bus',
  'Snohomish Pine Cone Charm',
];

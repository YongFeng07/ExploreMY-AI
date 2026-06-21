export * from './malaysia-cities';
export const PLACE_CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️' },
  { value: 'CAFE', label: 'Cafe', icon: '☕' },
  { value: 'ATTRACTION', label: 'Attraction', icon: '🏛️' },
  { value: 'SHOPPING_MALL', label: 'Shopping', icon: '🛍️' },
  { value: 'HOTEL', label: 'Hotel', icon: '🏨' },
  { value: 'PARK', label: 'Park', icon: '🌳' },
  { value: 'BEACH', label: 'Beach', icon: '🏖️' },
  { value: 'MUSEUM', label: 'Museum', icon: '🏛️' },
  { value: 'TEMPLE', label: 'Temple', icon: '🛕' },
  { value: 'NIGHT_MARKET', label: 'Night Market', icon: '🌙' },
] as const;

export const APP_NAME = 'ExploreMY AI';
export const APP_DESCRIPTION = 'AI-powered Malaysia travel discovery platform';
export const MAX_PHOTOS_PER_REVIEW = 10;
export const MAX_FAVORITES_PER_USER = 500;
export const DEFAULT_SEARCH_RADIUS_METERS = 5000;

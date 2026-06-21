// =============================================================================
// ExploreMY AI — App Constants
// =============================================================================

export const APP_NAME = 'ExploreMY AI';
export const APP_DESCRIPTION = 'Malaysia Intelligent Travel Operating System';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://exploremy.ai';

// Map defaults (Kuala Lumpur city center)
export const MAP_DEFAULTS = {
  center: { lat: 3.139, lng: 101.6869 },
  zoom: 14,
  minZoom: 8,
  maxZoom: 20,
  searchRadius: 5000, // 5km default
  nearbyRadius: 3000, // 3km for nearby
} as const;

// Category definitions with Malaysian-specific icons
export const CATEGORIES = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️', color: '#EF4444' },
  { value: 'CAFE', label: 'Cafe', icon: '☕', color: '#8B4513' },
  { value: 'STREET_FOOD', label: 'Street Food', icon: '🍜', color: '#F97316' },
  { value: 'NIGHT_MARKET', label: 'Night Market', icon: '🌙', color: '#7C3AED' },
  { value: 'ATTRACTION', label: 'Attraction', icon: '🏛️', color: '#3B82F6' },
  { value: 'SHOPPING_MALL', label: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { value: 'HOTEL', label: 'Hotel', icon: '🏨', color: '#06B6D4' },
  { value: 'PARK', label: 'Park', icon: '🌳', color: '#10B981' },
  { value: 'BEACH', label: 'Beach', icon: '🏖️', color: '#0EA5E9' },
  { value: 'HIKING_TRAIL', label: 'Hiking', icon: '🥾', color: '#84CC16' },
  { value: 'MUSEUM', label: 'Museum', icon: '🏛️', color: '#6366F1' },
  { value: 'TEMPLE', label: 'Temple', icon: '🛕', color: '#F59E0B' },
  { value: 'MOSQUE', label: 'Mosque', icon: '🕌', color: '#14B8A6' },
  { value: 'HOSPITAL', label: 'Hospital', icon: '🏥', color: '#DC2626' },
  { value: 'PHARMACY', label: 'Pharmacy', icon: '💊', color: '#059669' },
  { value: 'PETROL_STATION', label: 'Petrol', icon: '⛽', color: '#EAB308' },
  { value: 'EV_CHARGER', label: 'EV Charger', icon: '🔌', color: '#22C55E' },
  { value: 'PUBLIC_TOILET', label: 'Toilet', icon: '🚻', color: '#64748B' },
] as const;

// Transport mode definitions
export const TRANSPORT_MODES = [
  { value: 'WALKING', label: 'Walk', icon: '🚶', speedKmh: 5 },
  { value: 'DRIVING', label: 'Drive', icon: '🚗', speedKmh: 40 },
  { value: 'MOTORCYCLE', label: 'Motorcycle', icon: '🏍️', speedKmh: 35 },
  { value: 'GRAB', label: 'Grab', icon: '🚕', speedKmh: 35 },
  { value: 'BUS', label: 'Bus', icon: '🚌', speedKmh: 25 },
  { value: 'MRT', label: 'MRT', icon: '🚇', speedKmh: 45 },
  { value: 'LRT', label: 'LRT', icon: '🚈', speedKmh: 40 },
  { value: 'KTM', label: 'KTM', icon: '🚆', speedKmh: 50 },
  { value: 'ETS', label: 'ETS', icon: '🚄', speedKmh: 120 },
  { value: 'FLIGHT', label: 'Flight', icon: '✈️', speedKmh: 700 },
  { value: 'FERRY', label: 'Ferry', icon: '⛴️', speedKmh: 20 },
  { value: 'BICYCLE', label: 'Bicycle', icon: '🚲', speedKmh: 15 },
] as const;

// Malaysian states
export const MALAYSIA_STATES = [
  'Kuala Lumpur',
  'Selangor',
  'Penang',
  'Johor',
  'Melaka',
  'Perak',
  'Kedah',
  'Kelantan',
  'Terengganu',
  'Pahang',
  'Negeri Sembilan',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Labuan',
  'Putrajaya',
] as const;

// Popular Malaysian cities
export const POPULAR_CITIES = [
  'Kuala Lumpur',
  'George Town',
  'Johor Bahru',
  'Malacca City',
  'Ipoh',
  'Kota Kinabalu',
  'Kuching',
  'Langkawi',
  'Cameron Highlands',
  'Penang Island',
] as const;

// Budget levels
export const BUDGET_LEVELS = [
  { value: 1, label: 'Budget', description: 'RM 0–50/day' },
  { value: 2, label: 'Mid-Range', description: 'RM 50–150/day' },
  { value: 3, label: 'Premium', description: 'RM 150–500/day' },
  { value: 4, label: 'Luxury', description: 'RM 500+/day' },
] as const;

// Travel styles for onboarding
export const TRAVEL_STYLES = [
  { value: 'BUDGET', label: 'Budget Traveler', icon: '💰' },
  { value: 'FOODIE', label: 'Food Hunter', icon: '🍜' },
  { value: 'ADVENTURE', label: 'Adventurer', icon: '🧗' },
  { value: 'CULTURAL', label: 'Culture Seeker', icon: '🏯' },
  { value: 'FAMILY', label: 'Family Traveler', icon: '👨‍👩‍👧‍👦' },
  { value: 'LUXURY', label: 'Luxury Seeker', icon: '✨' },
  { value: 'SOLO', label: 'Solo Explorer', icon: '🎒' },
  { value: 'BACKPACKER', label: 'Backpacker', icon: '🎒' },
] as const;

// Achievement definitions
export const ACHIEVEMENTS = {
  FIRST_REVIEW: { code: 'FIRST_REVIEW', name: 'First Review', icon: '⭐', xp: 50 },
  FOOD_HUNTER_5: { code: 'FOOD_HUNTER_5', name: 'Food Hunter', icon: '🍜', xp: 100 },
  FOOD_HUNTER_25: { code: 'FOOD_HUNTER_25', name: 'Food Master', icon: '👨‍🍳', xp: 250 },
  EXPLORER_10: { code: 'EXPLORER_10', name: 'Malaysia Explorer', icon: '🗺️', xp: 150 },
  HIDDEN_GEM_3: { code: 'HIDDEN_GEM_3', name: 'Hidden Gem Hunter', icon: '💎', xp: 200 },
  CAFE_10: { code: 'CAFE_10', name: 'Cafe Collector', icon: '☕', xp: 150 },
  TRIP_PLANNER: { code: 'TRIP_PLANNER', name: 'Trip Planner', icon: '📋', xp: 100 },
  REVIEW_STREAK_7: { code: 'REVIEW_STREAK_7', name: 'Weekly Reviewer', icon: '🔥', xp: 300 },
  PHOTOGRAPHER_20: { code: 'PHOTOGRAPHER_20', name: 'Shutterbug', icon: '📸', xp: 200 },
  SOCIAL_50: { code: 'SOCIAL_50', name: 'Social Butterfly', icon: '🦋', xp: 150 },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Route type definitions
export const ROUTE_TYPES = [
  { value: 'FASTEST', label: 'Fastest', icon: '⚡', description: 'Shortest travel time' },
  { value: 'CHEAPEST', label: 'Cheapest', icon: '💰', description: 'Lowest cost' },
  { value: 'SCENIC', label: 'Scenic', icon: '🏞️', description: 'Most beautiful views' },
  { value: 'TOURIST', label: 'Tourist', icon: '📸', description: 'Passes top attractions' },
  { value: 'FOOD', label: 'Food Route', icon: '🍜', description: 'Best food stops' },
] as const;

// Carbon footprint per km (grams) by transport mode
export const CARBON_PER_KM: Record<string, number> = {
  WALKING: 0,
  BICYCLE: 0,
  MRT: 13,
  LRT: 13,
  KTM: 20,
  ETS: 6,
  BUS: 68,
  MOTORCYCLE: 103,
  GRAB: 150,
  DRIVING: 170,
  FERRY: 120,
  FLIGHT: 255,
};

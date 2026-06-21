// Hotel cost estimates per night (MYR) by city, group type, and style tier
export const HOTEL_COST_MATRIX: Record<string, Record<string, { budget: number; midRange: number; luxury: number }>> = {
  'Penang': {
    solo:    { budget: 60,  midRange: 150, luxury: 350 },
    couple:  { budget: 80,  midRange: 200, luxury: 450 },
    family:  { budget: 120, midRange: 280, luxury: 600 },
    friends: { budget: 100, midRange: 250, luxury: 500 },
  },
  'Kuala Lumpur': {
    solo:    { budget: 70,  midRange: 180, luxury: 500 },
    couple:  { budget: 90,  midRange: 250, luxury: 650 },
    family:  { budget: 140, midRange: 350, luxury: 800 },
    friends: { budget: 120, midRange: 300, luxury: 700 },
  },
  'Langkawi': {
    solo:    { budget: 50,  midRange: 150, luxury: 400 },
    couple:  { budget: 80,  midRange: 200, luxury: 500 },
    family:  { budget: 120, midRange: 300, luxury: 700 },
    friends: { budget: 100, midRange: 250, luxury: 600 },
  },
  'Cameron Highlands': {
    solo:    { budget: 40,  midRange: 100, luxury: 250 },
    couple:  { budget: 60,  midRange: 150, luxury: 350 },
    family:  { budget: 100, midRange: 220, luxury: 450 },
    friends: { budget: 80,  midRange: 180, luxury: 400 },
  },
  'Melaka': {
    solo:    { budget: 50,  midRange: 120, luxury: 280 },
    couple:  { budget: 70,  midRange: 180, luxury: 380 },
    family:  { budget: 100, midRange: 250, luxury: 500 },
    friends: { budget: 90,  midRange: 200, luxury: 450 },
  },
  'Johor Bahru': {
    solo:    { budget: 60,  midRange: 140, luxury: 300 },
    couple:  { budget: 80,  midRange: 200, luxury: 400 },
    family:  { budget: 120, midRange: 280, luxury: 550 },
    friends: { budget: 100, midRange: 240, luxury: 480 },
  },
  'Ipoh': {
    solo:    { budget: 50,  midRange: 110, luxury: 250 },
    couple:  { budget: 65,  midRange: 160, luxury: 350 },
    family:  { budget: 100, midRange: 230, luxury: 450 },
    friends: { budget: 85,  midRange: 190, luxury: 400 },
  },
  'Kota Kinabalu': {
    solo:    { budget: 55,  midRange: 140, luxury: 320 },
    couple:  { budget: 75,  midRange: 190, luxury: 420 },
    family:  { budget: 110, midRange: 270, luxury: 550 },
    friends: { budget: 95,  midRange: 230, luxury: 480 },
  },
  'Kuching': {
    solo:    { budget: 50,  midRange: 120, luxury: 280 },
    couple:  { budget: 65,  midRange: 170, luxury: 380 },
    family:  { budget: 100, midRange: 240, luxury: 500 },
    friends: { budget: 85,  midRange: 200, luxury: 430 },
  },
  'Kuantan': {
    solo:    { budget: 45,  midRange: 110, luxury: 260 },
    couple:  { budget: 60,  midRange: 160, luxury: 350 },
    family:  { budget: 95,  midRange: 230, luxury: 450 },
    friends: { budget: 80,  midRange: 190, luxury: 400 },
  },
  'Kuala Terengganu': {
    solo:    { budget: 45,  midRange: 100, luxury: 240 },
    couple:  { budget: 60,  midRange: 150, luxury: 320 },
    family:  { budget: 90,  midRange: 220, luxury: 420 },
    friends: { budget: 75,  midRange: 180, luxury: 380 },
  },
  'Putrajaya': {
    solo:    { budget: 65,  midRange: 170, luxury: 400 },
    couple:  { budget: 85,  midRange: 220, luxury: 520 },
    family:  { budget: 130, midRange: 320, luxury: 700 },
    friends: { budget: 110, midRange: 280, luxury: 600 },
  },
  'default': {
    solo:    { budget: 60,  midRange: 150, luxury: 350 },
    couple:  { budget: 80,  midRange: 200, luxury: 450 },
    family:  { budget: 120, midRange: 280, luxury: 600 },
    friends: { budget: 100, midRange: 240, luxury: 500 },
  },
} as const;

export type StyleTier = 'budget' | 'midRange' | 'luxury';

export function getHotelCost(
  city: string,
  groupType: string,
  styleTier: StyleTier = 'midRange',
): number {
  const cityRates = HOTEL_COST_MATRIX[city] ?? HOTEL_COST_MATRIX['default']!;
  const group = groupType.toLowerCase() as keyof typeof cityRates;
  const rates = (cityRates[group] as typeof cityRates['solo']) ?? cityRates['solo']!;
  return rates[styleTier];
}

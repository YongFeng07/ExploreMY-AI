// Meal cost estimates per person (MYR) by city and meal type
export const MEAL_COST_MATRIX: Record<string, Record<string, { min: number; max: number; typical: number }>> = {
  'Kuala Lumpur': {
    breakfast: { min: 5, max: 25, typical: 12 },
    lunch:     { min: 8, max: 35, typical: 18 },
    dinner:    { min: 15, max: 80, typical: 30 },
    cafe:      { min: 10, max: 25, typical: 15 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Penang': {
    breakfast: { min: 4, max: 15, typical: 8 },
    lunch:     { min: 6, max: 25, typical: 12 },
    dinner:    { min: 10, max: 50, typical: 20 },
    cafe:      { min: 8, max: 20, typical: 12 },
    supper:    { min: 6, max: 20, typical: 10 },
  },
  'Langkawi': {
    breakfast: { min: 5, max: 20, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 60, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Cameron Highlands': {
    breakfast: { min: 4, max: 12, typical: 7 },
    lunch:     { min: 6, max: 20, typical: 10 },
    dinner:    { min: 10, max: 35, typical: 18 },
    cafe:      { min: 6, max: 18, typical: 10 },
    supper:    { min: 5, max: 15, typical: 8 },
  },
  'Melaka': {
    breakfast: { min: 4, max: 15, typical: 8 },
    lunch:     { min: 6, max: 25, typical: 12 },
    dinner:    { min: 10, max: 45, typical: 20 },
    cafe:      { min: 8, max: 20, typical: 12 },
    supper:    { min: 6, max: 20, typical: 10 },
  },
  'Johor Bahru': {
    breakfast: { min: 5, max: 18, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 55, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Ipoh': {
    breakfast: { min: 4, max: 12, typical: 7 },
    lunch:     { min: 6, max: 20, typical: 10 },
    dinner:    { min: 8, max: 35, typical: 18 },
    cafe:      { min: 6, max: 18, typical: 10 },
    supper:    { min: 5, max: 18, typical: 8 },
  },
  'Kota Kinabalu': {
    breakfast: { min: 5, max: 18, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 50, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
  'Kuching': {
    breakfast: { min: 4, max: 15, typical: 8 },
    lunch:     { min: 6, max: 25, typical: 12 },
    dinner:    { min: 10, max: 45, typical: 20 },
    cafe:      { min: 7, max: 20, typical: 12 },
    supper:    { min: 6, max: 20, typical: 10 },
  },
  'default': {
    breakfast: { min: 5, max: 20, typical: 10 },
    lunch:     { min: 8, max: 30, typical: 15 },
    dinner:    { min: 12, max: 60, typical: 25 },
    cafe:      { min: 8, max: 22, typical: 14 },
    supper:    { min: 8, max: 25, typical: 12 },
  },
} as const;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'cafe' | 'supper';

export function getMealCost(city: string, mealType: MealType, styleTier: 'budget' | 'midRange' | 'luxury' = 'midRange'): number {
  const cityRates = MEAL_COST_MATRIX[city] ?? MEAL_COST_MATRIX['default']!;
  const rates = cityRates[mealType] ?? cityRates['lunch']!;
  switch (styleTier) {
    case 'budget':  return rates.min;
    case 'luxury':  return rates.max;
    default:        return rates.typical;
  }
}

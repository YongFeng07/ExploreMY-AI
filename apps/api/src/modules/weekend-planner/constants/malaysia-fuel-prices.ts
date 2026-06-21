// Malaysian fuel prices (MYR per liter) — updated periodically
export const FUEL_PRICES_MYR = {
  RON95: 2.05,      // Subsidized
  RON97: 3.47,      // Market price
  DIESEL_EURO5: 2.15,
} as const;

// Average fuel consumption (L per 100km)
export const FUEL_CONSUMPTION = {
  car_compact: 6.5,
  car_midsize: 8.0,
  car_suv: 10.5,
  car_mpv: 11.0,    // Common Malaysian family vehicle (e.g. Perodua Alza, Toyota Innova)
  motorcycle: 3.0,
} as const;

export type FuelType = keyof typeof FUEL_PRICES_MYR;
export type VehicleType = keyof typeof FUEL_CONSUMPTION;

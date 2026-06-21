// Parking rates by city (MYR per hour) — approximate averages
export const PARKING_RATES: Record<string, { min: number; max: number; flatDay?: number }> = {
  'Kuala Lumpur':    { min: 3.00, max: 15.00, flatDay: 25.00 },
  'Penang':          { min: 2.00, max: 8.00,  flatDay: 12.00 },
  'Johor Bahru':     { min: 2.00, max: 8.00,  flatDay: 15.00 },
  'Melaka':          { min: 1.50, max: 6.00,  flatDay: 8.00  },
  'Ipoh':            { min: 1.00, max: 5.00,  flatDay: 8.00  },
  'Kota Kinabalu':   { min: 2.00, max: 8.00,  flatDay: 12.00 },
  'Langkawi':        { min: 1.00, max: 4.00,  flatDay: 6.00  },
  'Cameron Highlands': { min: 1.00, max: 4.00, flatDay: 5.00  },
  'Kuching':         { min: 1.50, max: 5.00,  flatDay: 8.00  },
  'Kuantan':         { min: 1.00, max: 4.00,  flatDay: 6.00  },
  'Kuala Terengganu': { min: 1.00, max: 3.00, flatDay: 5.00  },
  'Putrajaya':       { min: 2.00, max: 6.00,  flatDay: 10.00 },
  'Petaling Jaya':   { min: 2.00, max: 8.00,  flatDay: 12.00 },
  'Shah Alam':       { min: 1.50, max: 6.00,  flatDay: 8.00  },
  'default':         { min: 2.00, max: 8.00,  flatDay: 12.00 },
} as const;

/**
 * Calculate parking cost for a given city, number of stops, and hours.
 */
export function estimateParkingCost(city: string, stopCount: number, hoursPerStop: number = 2): number {
  const rates = PARKING_RATES[city] ?? PARKING_RATES['default']!;
  // Assume parking at ~60% of stops (some stops may share parking or be walking distance)
  const parkingStops = Math.ceil(stopCount * 0.6);
  const hourlyRate = (rates.min + rates.max) / 2;
  // Cap daily parking at flat day rate if available
  const totalHourly = parkingStops * hoursPerStop * hourlyRate;
  if (rates.flatDay && totalHourly > rates.flatDay) {
    return rates.flatDay;
  }
  return Math.round(totalHourly * 100) / 100;
}

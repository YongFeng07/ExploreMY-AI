import { Injectable } from '@nestjs/common';

// =============================================================================
// REAL MALAYSIAN HIGHWAY DATA
// =============================================================================

const HIGHWAY_RNR: Record<string, {name:string;km:number;lat:number;lng:number;facilities:string[];tags:string[]}[]> = {
  'PLUS_NORTH': [
    {name:'R&R Rawang (Northbound)',km:30,lat:3.32,lng:101.55,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','WiFi'],tags:['family','food','scenic']},
    {name:'R&R Sungai Buloh (Northbound)',km:40,lat:3.28,lng:101.53,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking'],tags:['family','food']},
    {name:'R&R Ulu Bernam (Northbound)',km:85,lat:3.45,lng:101.42,facilities:['Food Court','Toilets','Surau','Parking'],tags:['scenic','nature']},
    {name:'R&R Tapah (Northbound)',km:130,lat:4.20,lng:101.26,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','Souvenir Shop'],tags:['food','scenic','family']},
    {name:'R&R Sungai Perak (Northbound)',km:200,lat:4.58,lng:101.12,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','Restoran Jejantas'],tags:['scenic','food','romantic','photo']},
    {name:'R&R Gunung Semanggol (Northbound)',km:250,lat:5.02,lng:100.63,facilities:['Food Court','Toilets','Surau','Parking'],tags:['nature','scenic']},
    {name:'R&R Juru (Northbound)',km:320,lat:5.33,lng:100.43,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','ATM'],tags:['food','family']},
  ],
  'PLUS_SOUTH': [
    {name:'R&R Seremban (Southbound)',km:60,lat:2.73,lng:101.94,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking'],tags:['food','family']},
    {name:'R&R Ayer Keroh (Southbound)',km:130,lat:2.27,lng:102.28,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','ATM'],tags:['food','scenic','family']},
    {name:'R&R Pagoh (Southbound)',km:170,lat:2.15,lng:102.77,facilities:['Food Court','Toilets','Surau','Parking'],tags:['nature','scenic']},
    {name:'R&R Machap (Southbound)',km:210,lat:1.85,lng:103.25,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking'],tags:['food','scenic']},
    {name:'R&R Skudai (Southbound)',km:310,lat:1.55,lng:103.66,facilities:['Food Court','Toilets','Surau','Petrol Station','Parking','ATM'],tags:['food','family']},
  ],
};

const PETROL_STATIONS = [
  {brand:'Petronas',fuelTypes:['RON95','RON97','Diesel'],facilities:['Toilet','Surau','Mini Mart','ATM'],avgRating:4.1},
  {brand:'Shell',fuelTypes:['RON95','RON97','V-Power'],facilities:['Toilet','Surau','Select','ATM'],avgRating:4.2},
  {brand:'Petron',fuelTypes:['RON95','RON97','Diesel'],facilities:['Toilet','Surau','Kedai Mesra','ATM'],avgRating:4.0},
  {brand:'BHPetrol',fuelTypes:['RON95','RON97','Diesel'],facilities:['Toilet','Surau','BHPetromart','ATM'],avgRating:4.1},
  {brand:'Caltex',fuelTypes:['RON95','RON97','Diesel'],facilities:['Toilet','Surau','Star Mart','ATM'],avgRating:4.0},
];

const EMERGENCY_CONTACTS = {
  highwayPatrol: {name:'PLUS Hotline',number:'1800-88-0000',available:'24/7'},
  police: {name:'Police',number:'999',available:'24/7'},
  ambulance: {name:'Ambulance',number:'999',available:'24/7'},
  fireDept: {name:'Fire Dept',number:'994',available:'24/7'},
  towTruck: {name:'PLUS Tow',number:'1800-88-0000',available:'24/7'},
};

// =============================================================================
// STRATEGY PROFILES — Each strategy has real, differentiated parameters
// =============================================================================

interface StrategyProfile {
  label: string;
  description: string;
  vehicleType: 'car_compact'|'car_midsize'|'car_suv'|'car_mpv';
  fuelConsumptionL: number;      // L/100km
  avgSpeedKmh: number;           // Highway average speed
  restStopIntervalKm: number;    // How often to stop
  suggestedBreakMin: number;     // How long each break
  tollAvoidance: number;         // 0 = all tolls, 1 = avoid all tolls
  scenicDetourPct: number;       // Extra distance for scenic routing (0-30%)
  fuelRangeKm: number;           // Range between fuel stops
  restStopTagPreference: string[]; // Preferred R&R tags
  foodCostMultiplier: number;    // Food cost vs baseline RM 15
  hotelCostPerRoom: number;      // RM/night
  emergencyPct: number;          // Emergency buffer %
  carbonMultiplier: number;      // CO2 vs baseline
}

const STRATEGY_PROFILES: Record<string, StrategyProfile> = {
  FASTEST: {
    label: 'Fastest Route',
    description: 'Optimized for minimum travel time — maximum highway usage, fewer stops, highest average speed.',
    vehicleType: 'car_midsize', fuelConsumptionL: 8.5, avgSpeedKmh: 105,
    restStopIntervalKm: 180, suggestedBreakMin: 15, tollAvoidance: 0,
    scenicDetourPct: 0, fuelRangeKm: 380,
    restStopTagPreference: [], foodCostMultiplier: 1.0,
    hotelCostPerRoom: 180, emergencyPct: 10, carbonMultiplier: 1.05,
  },
  CHEAPEST: {
    label: 'Cheapest Route',
    description: 'Minimized total cost — fuel-efficient compact car, partial toll avoidance via federal routes, budget stops.',
    vehicleType: 'car_compact', fuelConsumptionL: 6.0, avgSpeedKmh: 70,
    restStopIntervalKm: 160, suggestedBreakMin: 15, tollAvoidance: 0.5,
    scenicDetourPct: 0, fuelRangeKm: 480,
    restStopTagPreference: [], foodCostMultiplier: 0.6,
    hotelCostPerRoom: 80, emergencyPct: 8, carbonMultiplier: 0.85,
  },
  SCENIC: {
    label: 'Scenic Route',
    description: 'Curated for the best views — scenic detours through countryside, mountain vistas, coastal roads where available.',
    vehicleType: 'car_midsize', fuelConsumptionL: 8.0, avgSpeedKmh: 75,
    restStopIntervalKm: 90, suggestedBreakMin: 25, tollAvoidance: 0.2,
    scenicDetourPct: 20, fuelRangeKm: 350,
    restStopTagPreference: ['scenic','nature','photo'], foodCostMultiplier: 1.2,
    hotelCostPerRoom: 200, emergencyPct: 15, carbonMultiplier: 1.2,
  },
  FOODIE: {
    label: 'Food Route',
    description: 'Routes through Malaysia\'s best food towns — famous R&R food courts, local kopitiams, iconic roadside eateries.',
    vehicleType: 'car_midsize', fuelConsumptionL: 8.0, avgSpeedKmh: 85,
    restStopIntervalKm: 100, suggestedBreakMin: 30, tollAvoidance: 0,
    scenicDetourPct: 5, fuelRangeKm: 350,
    restStopTagPreference: ['food'], foodCostMultiplier: 1.8,
    hotelCostPerRoom: 160, emergencyPct: 12, carbonMultiplier: 1.0,
  },
  FAMILY: {
    label: 'Family Route',
    description: 'Kid-friendly journey — more frequent breaks, family-oriented R&Rs with play areas, larger vehicle for comfort.',
    vehicleType: 'car_mpv', fuelConsumptionL: 10.5, avgSpeedKmh: 80,
    restStopIntervalKm: 80, suggestedBreakMin: 25, tollAvoidance: 0,
    scenicDetourPct: 0, fuelRangeKm: 320,
    restStopTagPreference: ['family','food'], foodCostMultiplier: 1.3,
    hotelCostPerRoom: 200, emergencyPct: 15, carbonMultiplier: 1.3,
  },
  COUPLE: {
    label: 'Couple\'s Route',
    description: 'Romantic journey — scenic viewpoints, sunset stops, cozy cafes, and premium rest experiences for two.',
    vehicleType: 'car_compact', fuelConsumptionL: 6.5, avgSpeedKmh: 80,
    restStopIntervalKm: 100, suggestedBreakMin: 30, tollAvoidance: 0.1,
    scenicDetourPct: 10, fuelRangeKm: 420,
    restStopTagPreference: ['scenic','romantic','photo','food'], foodCostMultiplier: 1.5,
    hotelCostPerRoom: 300, emergencyPct: 12, carbonMultiplier: 0.9,
  },
};

// =============================================================================
// TYPES
// =============================================================================

export interface RouteResult {
  distanceKm: number;
  originalDistanceKm: number;    // Before scenic detour
  durationMin: number;
  fuelStops: FuelStop[];
  restStops: RestStop[];
  tollCost: number;
  fuelCost: number;
  totalCost: number;
  carbonKg: number;
  strategy: string;
  avgSpeedKmh: number;
  polyline?: string;
}

export interface FuelStop {
  order: number; distanceFromStart: number; stationBrand: string;
  estimatedFuelLiters: number; estimatedCost: number; fuelType: string;
  facilities: string[];
}

export interface RestStop {
  order: number; distanceFromStart: number; name: string;
  facilities: string[]; suggestedBreakMin: number; tags: string[];
}

export interface RoadtripBudget {
  fuel: { distanceKm:number; consumptionLPer100km:number; litersUsed:number; pricePerLiter:number; totalCost:number };
  toll: { routes:{name:string;cost:number}[]; totalCost:number };
  food: { restStops:number; costPerStop:number; totalCost:number };
  parking: { days:number; costPerDay:number; totalCost:number };
  hotel: { nights:number; rooms:number; costPerRoom:number; totalCost:number };
  emergencyBuffer: { percentage:number; amount:number };
  grandTotal: number;
  budgetHealth: 'HEALTHY'|'WATCH'|'WARNING'|'OVER';
  budgetScore: number;
}

// =============================================================================
// ENGINE
// =============================================================================

@Injectable()
export class RoadtripEngineService {
  /** Calculate strategy-aware route between two Malaysian points */
  calculateRoute(
    originLat: number, originLng: number,
    destLat: number, destLng: number,
    vehicleType: 'car_compact'|'car_midsize'|'car_suv'|'car_mpv' = 'car_midsize',
    dayCount = 2,
    style: string = 'FASTEST',
  ): RouteResult {
    const profile = STRATEGY_PROFILES[style] || STRATEGY_PROFILES['FASTEST']!;

    // Real haversine distance
    const rawDistKm = this.haversineKm(originLat, originLng, destLat, destLng);

    // Apply scenic detour (adds distance for scenic routes)
    const detourKm = Math.round(rawDistKm * profile.scenicDetourPct / 100);
    const distKm = rawDistKm + detourKm;

    // Strategy-specific average speed
    const avgSpeed = profile.avgSpeedKmh;
    // Driving time = distance / speed + rest stop time
    const restStopCount = Math.max(1, Math.floor(distKm / profile.restStopIntervalKm));
    const totalRestMin = restStopCount * profile.suggestedBreakMin;
    const durationMin = Math.round((distKm / avgSpeed) * 60) + totalRestMin;

    // ── Fuel Stops ──
    const fuelStopCount = Math.max(1, Math.floor(distKm / profile.fuelRangeKm));
    const fuelStops: FuelStop[] = [];
    for (let i = 0; i < fuelStopCount; i++) {
      const stationIdx = (style === 'CHEAPEST') ? (i % 2 === 0 ? 0 : 2) // Petronas + Petron (cheaper)
        : (style === 'COUPLE') ? (i % 2 === 0 ? 1 : 0) // Shell + Petronas (premium)
        : i % PETROL_STATIONS.length;
      const station = PETROL_STATIONS[stationIdx]!;
      const dist = Math.round(distKm * (i + 1) / (fuelStopCount + 1));
      const liters = profile.fuelConsumptionL * (dist / 100);
      const fuelType = (style === 'COUPLE') ? 'RON97' : 'RON95';
      const pricePerL = fuelType === 'RON97' ? 3.55 : 2.05;
      fuelStops.push({
        order: i + 1, distanceFromStart: dist,
        stationBrand: station.brand,
        estimatedFuelLiters: Math.round(liters * 10) / 10,
        estimatedCost: Math.round(liters * pricePerL * 100) / 100,
        fuelType,
        facilities: station.facilities,
      });
    }

    // ── Rest Stops (strategy-aware selection) ──
    const restStops: RestStop[] = [];
    const highwayKey = destLat > 3.5 ? 'PLUS_NORTH' : 'PLUS_SOUTH';
    const highwayRnR = HIGHWAY_RNR[highwayKey] || HIGHWAY_RNR['PLUS_NORTH']!;

    for (let i = 0; i < restStopCount; i++) {
      const targetDist = Math.round(distKm * (i + 1) / (restStopCount + 1));

      // Filter R&Rs by strategy preference tags
      const preferred = highwayRnR.filter(r =>
        profile.restStopTagPreference.length === 0 ||
        r.tags.some(t => profile.restStopTagPreference.includes(t))
      );

      // If no preferred match, use all R&Rs
      const pool = preferred.length > 0 ? preferred : highwayRnR;

      // Find nearest to target distance
      const nearestRnR = pool.reduce((a, b) =>
        Math.abs(b.km - targetDist) < Math.abs(a.km - targetDist) ? b : a
      );

      restStops.push({
        order: i + 1,
        distanceFromStart: Math.round(nearestRnR.km * (distKm / (nearestRnR.km > rawDistKm ? rawDistKm : distKm))),
        name: nearestRnR.name,
        facilities: nearestRnR.facilities,
        suggestedBreakMin: profile.suggestedBreakMin,
        tags: nearestRnR.tags,
      });
    }

    // ── Toll Cost ──
    // Malaysian highway toll: ~RM 0.12/km on PLUS, ~RM 0.05/km on federal
    const tollRate = 0.12 * (1 - profile.tollAvoidance); // Lower rate = avoiding tolls
    const tollKm = distKm * (1 - profile.tollAvoidance);
    const federalKm = distKm * profile.tollAvoidance;
    const tollCost = Math.round((tollKm * 0.12 + federalKm * 0.03) * 100) / 100;

    const fuelCost = fuelStops.reduce((s, f) => s + f.estimatedCost, 0);
    const totalCost = Math.round((fuelCost + tollCost) * 100) / 100;

    return {
      distanceKm: Math.round(distKm * 10) / 10,
      originalDistanceKm: Math.round(rawDistKm * 10) / 10,
      durationMin,
      fuelStops,
      restStops,
      tollCost,
      fuelCost,
      totalCost,
      carbonKg: Math.round(distKm * 0.12 * profile.carbonMultiplier * 10) / 10,
      strategy: style,
      avgSpeedKmh: avgSpeed,
    };
  }

  /** Calculate strategy-aware complete budget with health indicator */
  calculateBudget(route: RouteResult, vehicleType: string, dayCount: number, pax: number, style: string): RoadtripBudget {
    const profile = STRATEGY_PROFILES[style] || STRATEGY_PROFILES['FASTEST']!;
    const consumption = profile.fuelConsumptionL;
    const litersUsed = (route.distanceKm / 100) * consumption;

    const fuel = {
      distanceKm: route.distanceKm,
      consumptionLPer100km: consumption,
      litersUsed: Math.round(litersUsed * 10) / 10,
      pricePerLiter: style === 'COUPLE' ? 2.50 : 2.05, // RON97 for couple
      totalCost: Math.round(litersUsed * (style === 'COUPLE' ? 2.50 : 2.05) * 100) / 100,
    };

    // Toll routes — differentiate PLUS vs federal
    const tollRoutes: { name: string; cost: number }[] = [];
    if (route.tollCost > 0) {
      tollRoutes.push({ name: 'PLUS Highway Toll', cost: Math.round(route.tollCost * 0.85 * 100) / 100 });
      if (profile.tollAvoidance > 0) {
        tollRoutes.push({ name: 'Federal Route (toll-free sections)', cost: 0 });
      }
    }
    const toll = {
      routes: tollRoutes,
      totalCost: route.tollCost,
    };

    const baseRestStopCost = 15;
    const costPerStop = Math.round(baseRestStopCost * profile.foodCostMultiplier);
    const food = {
      restStops: route.restStops.length,
      costPerStop,
      totalCost: route.restStops.length * costPerStop * pax,
    };

    const parking = {
      days: dayCount,
      costPerDay: style === 'CHEAPEST' ? 5 : style === 'COUPLE' ? 12 : 8,
      totalCost: dayCount * (style === 'CHEAPEST' ? 5 : style === 'COUPLE' ? 12 : 8),
    };

    const rooms = Math.max(1, Math.ceil(pax / 2));
    const nights = Math.max(1, dayCount - 1);
    const costPerRoom = profile.hotelCostPerRoom;
    const hotel = {
      nights, rooms,
      costPerRoom,
      totalCost: nights * rooms * costPerRoom,
    };

    const subtotal = fuel.totalCost + toll.totalCost + food.totalCost + parking.totalCost + hotel.totalCost;
    const emergencyPct = profile.emergencyPct;
    const emergencyBuffer = {
      percentage: emergencyPct,
      amount: Math.round(subtotal * emergencyPct / 100 * 100) / 100,
    };

    const grandTotal = subtotal + emergencyBuffer.amount;
    const budgetRatio = emergencyBuffer.amount / subtotal;
    const budgetHealth: RoadtripBudget['budgetHealth'] =
      budgetRatio > 0.12 ? 'HEALTHY' :
      budgetRatio > 0.06 ? 'WATCH' :
      budgetRatio > 0.03 ? 'WARNING' : 'OVER';

    return {
      fuel, toll, food, parking, hotel, emergencyBuffer,
      grandTotal: Math.round(grandTotal * 100) / 100,
      budgetHealth,
      budgetScore: Math.min(100, Math.round(budgetRatio * 800)),
    };
  }

  /** Get strategy-specific recommendations */
  getStrategyRecommendations(style: string, distKm: number, dayCount: number) {
    const profile = STRATEGY_PROFILES[style] || STRATEGY_PROFILES['FASTEST']!;
    const tips: Record<string, string[]> = {
      FASTEST: [
        'Depart before 6:30 AM for maximum highway speed and zero traffic.',
        'Use RFID lanes at toll plazas — faster throughput than TnG or cash.',
        `Best departure window: 5:30–6:30 AM. Estimated arrival in ${Math.round(distKm / profile.avgSpeedKmh)}h driving.`,
        'Minimize stops — fuel-only stops recommended, skip rest stops under 150km.',
        'Check PLUS Twitter @plustrafik for real-time lane closure updates.',
      ],
      CHEAPEST: [
        `Switch to federal route FT1 for ~${Math.round(distKm * 0.3)}km — saves RM ${Math.round(distKm * 0.3 * 0.09)} in tolls.`,
        'Use PETRONAS stations — Mesra card gives 3% cashback on fuel.',
        'Pack sandwiches and water — skip R&R food courts, save RM 15-20/person.',
        'Travel during off-peak hours for better fuel efficiency (steady 80km/h).',
        'Check Touch \'n Go eWallet for toll rebate promotions.',
      ],
      SCENIC: [
        `Add ~${Math.round(distKm * 0.2)}km scenic detour via countryside roads — worth it for the views.`,
        'Best photo stops: R&R Sungai Perak (overhead bridge restaurant) and mountain vistas.',
        'Golden hour driving (5:30–7:30 PM) yields the best landscape views.',
        'Keep camera ready — wildlife sightings (hornbills, monkeys) common near forest reserves.',
        'Stop at R&R Tapah for the souvenir shop — local crafts and Cameron Highlands tea.',
      ],
      FOODIE: [
        'R&R Sungai Perak overhead bridge restaurant is a must-stop — unique dining above the highway.',
        'Exit at Ipoh for the famous white coffee and tau fu fah at Funny Mountain.',
        'R&R Ayer Keroh has the best food court on the southern route — try the laksa Johor.',
        'Bentong ginger tea and homemade ice cream are legendary — worth the 5-min detour.',
        'Pack a cooler bag for takeaway local delicacies — seremban siew pow travels well.',
      ],
      FAMILY: [
        `Stop every ${profile.restStopIntervalKm}km for kids to stretch — ${restStopCount(distKm, profile.restStopIntervalKm)} planned breaks.`,
        'R&Rs with family facilities: Rawang, Tapah, Juru (North) / Seremban, Ayer Keroh (South).',
        'All PLUS R&Rs have surau (prayer rooms) and clean baby-changing facilities.',
        'Pack entertainment for kids — some highway sections have limited mobile coverage.',
        'Keep emergency kit accessible: wet wipes, plastic bags, change of clothes, snacks.',
      ],
      COUPLE: [
        'Time your departure so you reach R&R Sungai Perak at sunset — the overhead bridge restaurant is romantic.',
        'Detour to Sekinchan fishing village for Instagram-worthy padi field photos.',
        'Book a hotel with a view — splurge on the sea-facing room, it\'s worth it.',
        'Pack a curated roadtrip playlist and a small picnic for a scenic stop.',
        'Use Shell V-Power for smoother engine performance on the open highway.',
      ],
    };
    return tips[style] || tips['FASTEST']!;
  }

  /** Get emergency contacts along route */
  getEmergencyInfo(lat: number, lng: number) {
    return {
      contacts: EMERGENCY_CONTACTS,
      nearestHospital: {name:'Nearest District Hospital',distance:'~15-30km along route',hotline:'999'},
      nearestPolice: {name:'Nearest Police Station',distance:'~10-20km along route',hotline:'999'},
      nearestWorkshop: {name:'PLUS Highway Workshop',distance:'~20-40km along route',hotline:'1800-88-0000'},
      towTruck: {name:'PLUS Tow Service',hotline:'1800-88-0000',eta:'~30-45 min'},
    };
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; const dLat = (lat2-lat1)*Math.PI/180; const dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}

function restStopCount(distKm: number, intervalKm: number): number {
  return Math.max(1, Math.floor(distKm / intervalKm));
}

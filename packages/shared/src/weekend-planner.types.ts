import { z } from 'zod';

// =============================================================================
// INPUT VALIDATION SCHEMA
// =============================================================================

export const weekendPlanInputSchema = z.object({
  destination: z.string().min(2).max(255),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  planType: z.enum(['ONE_DAY', 'TWO_DAY', 'THREE_DAY', 'FULL_WEEKEND']),
  budget: z.number().positive().max(50000),
  budgetCurrency: z.string().length(3).default('MYR'),
  transportMode: z.enum(['DRIVING', 'GRAB', 'BUS', 'KTM', 'ETS', 'MOTORCYCLE', 'WALKING', 'MIXED']),
  groupType: z.enum(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS']),
  travelStyles: z.array(
    z.enum(['ADVENTURE', 'LUXURY', 'BUDGET', 'NATURE', 'FOODIE', 'PHOTOGRAPHY', 'NIGHTLIFE'])
  ).min(1),
  specialPreferences: z.array(
    z.enum(['PET_FRIENDLY', 'KID_FRIENDLY', 'WHEELCHAIR_FRIENDLY', 'HALAL_FOOD', 'VEGETARIAN'])
  ).default([]),
  groupSize: z.number().int().min(1).max(20).default(1),
});

export type WeekendPlanInput = z.infer<typeof weekendPlanInputSchema>;

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface WeekendPlanOutput {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  planType: string;
  budget: number;
  budgetCurrency: string;
  transportMode: string;
  groupType: string;
  travelStyles: string[];
  specialPreferences: string[];
  groupSize: number;
  totalCost: number;
  totalDistance: number;
  totalTravelTime: number;
  totalStops: number;
  hiddenGemCount: number;
  status: string;
  isPublic: boolean;
  shareToken?: string;
  days: WeekendDayOutput[];
  budgetBreakdown: BudgetBreakdownOutput;
  tips: string[];
  weatherSummary: string;
  createdAt: string;
}

export interface WeekendDayOutput {
  id: string;
  dayNumber: number;
  date: string;
  theme: string;
  weather: {
    condition: string;
    tempMin: number;
    tempMax: number;
    rainChance: number;
  };
  stops: StopOutput[];
  dayTotalCost: number;
  dayTotalDistance: number;
  dayTotalTime: number;
}

export interface StopOutput {
  id: string;
  order: number;
  time: string;
  endTime: string;
  durationMinutes: number;
  placeName: string;
  placeId?: string;
  category: string;
  emoji: string;
  description: string;
  photoUrl?: string;
  rating?: number;
  entryFee: number;
  estimatedSpend: number;
  totalCost: number;
  currency: string;
  transportFromPrev: {
    mode: string;
    distanceMeters: number;
    durationMinutes: number;
    estimatedCost: number;
  };
  isHiddenGem: boolean;
  isPhotoSpot: boolean;
  isIndoor: boolean;
  crowdLevel: string;
  aiReasoning?: string;
  isLocked: boolean;
}

export interface BudgetBreakdownOutput {
  fuel: CostLineItem;
  toll: CostLineItem;
  parking: CostLineItem;
  hotel: CostLineItem & { suggestions: { name: string; price: number; rating: number }[] };
  food: CostLineItem & { mealCount: number; perPersonPerMeal: number };
  tickets: CostLineItem & { attractions: { name: string; price: number; quantity: number }[] };
  transport: CostLineItem & { segments: number };
  emergencyBuffer: CostLineItem & { percentage: number };
  total: number;
  currency: string;
  budgetUtilization: number;
  isWithinBudget: boolean;
}

export interface CostLineItem {
  estimatedCost: number;
  actualCost?: number;
  label: string;
  percentage: number;
}

export interface RouteSummaryOutput {
  dayNumber: number;
  totalDistance: number;
  totalDuration: number;
  totalDurationInTraffic: number;
  transportModes: { mode: string; distance: number; percentage: number }[];
  polyline: string;
}

// =============================================================================
// AI OUTPUT SCHEMA (what the LLM returns)
// =============================================================================

export const aiStopSchema = z.object({
  order: z.number().int().min(1),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().positive(),
  placeId: z.string(),
  placeName: z.string().min(1),
  category: z.enum([
    'BREAKFAST', 'BRUNCH', 'LUNCH', 'CAFE_STOP', 'DINNER', 'SUPPER',
    'TOURIST_ATTRACTION', 'HIDDEN_GEM', 'PHOTO_SPOT', 'NIGHT_ACTIVITY', 'SHOPPING', 'NATURE',
  ]),
  emoji: z.string(),
  description: z.string().min(10).max(200),
  estimatedSpend: z.number().min(0),
  entryFee: z.number().min(0),
  isHiddenGem: z.boolean(),
  isPhotoSpot: z.boolean(),
  isIndoor: z.boolean(),
  crowdLevel: z.enum(['low', 'medium', 'high']),
  aiReasoning: z.string(),
  transportFromPrev: z.object({
    mode: z.enum(['WALKING', 'DRIVING', 'GRAB', 'BUS', 'KTM', 'ETS', 'BICYCLE', 'MOTORCYCLE']),
    distanceMeters: z.number().min(0),
    durationMinutes: z.number().min(0),
    estimatedCost: z.number().min(0),
  }),
});

export const aiDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(3),
  theme: z.string().min(3),
  weatherNote: z.string(),
  stops: z.array(aiStopSchema).min(4).max(10),
});

export const aiBudgetBreakdownSchema = z.object({
  hotel: z.object({ estimatedCost: z.number(), suggestion: z.string(), suggestionRating: z.number() }),
  food: z.object({ estimatedCost: z.number(), mealCount: z.number() }),
  transport: z.object({ estimatedCost: z.number(), primaryMode: z.string() }),
  tickets: z.object({ estimatedCost: z.number(), attractions: z.array(z.object({ name: z.string(), price: z.number() })) }),
  fuel: z.object({ estimatedCost: z.number(), totalDistanceKm: z.number() }),
  toll: z.object({ estimatedCost: z.number(), tollRoutes: z.array(z.string()) }),
  parking: z.object({ estimatedCost: z.number(), parkingSpots: z.number() }),
  emergencyBuffer: z.object({ estimatedCost: z.number(), percentage: z.number() }),
  total: z.number().positive(),
});

export const aiWeekendPlanSchema = z.object({
  title: z.string().min(5).max(255),
  days: z.array(aiDaySchema).min(1).max(3),
  budgetBreakdown: aiBudgetBreakdownSchema,
  tips: z.array(z.string()).min(2).max(6),
});

export type AIWeekendPlanOutput = z.infer<typeof aiWeekendPlanSchema>;

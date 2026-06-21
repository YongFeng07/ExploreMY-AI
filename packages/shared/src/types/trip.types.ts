export interface TripPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetCurrency: string;
  travelStyle?: string;
  status: 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  totalCost?: number;
  totalDistance?: number;
  carbonFootprint?: number;
  dayCount: number;
  isPublic: boolean;
  shareToken?: string;
  days: TripDay[];
  createdAt: string;
}

export interface TripDay {
  id: string;
  dayNumber: number;
  date: string;
  theme?: string;
  notes?: string;
  weather?: { condition: string; tempMin: number; tempMax: number };
  stops: TripStop[];
}

export interface TripStop {
  id: string;
  order: number;
  placeId: string;
  placeName: string;
  category: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  transportFromPrevious?: string;
  costEstimate?: number;
  distanceFromPrevious?: number;
}

import { Injectable, Logger } from '@nestjs/common';

/** 8-dimensional travel personality profile */
export interface TravelDNAProfile {
  foodie: number;
  adventure: number;
  luxury: number;
  budget: number;
  nature: number;
  culture: number;
  nightlife: number;
  photography: number;
}

export interface TravelDNAState {
  userId: string;
  profile: TravelDNAProfile;
  favoriteCuisines: Record<string, number>;
  favoriteActivities: Record<string, number>;
  preferredStartTime: string;
  preferredPace: 'relaxed' | 'moderate' | 'packed';
  avgTripBudget: number;
  totalTrips: number;
  totalStops: number;
  likedStops: number;
  dislikedStops: number;
  lastUpdate: string;
}

const DEFAULT_PROFILE: TravelDNAProfile = {
  foodie: 0.5, adventure: 0.5, luxury: 0.5, budget: 0.5,
  nature: 0.5, culture: 0.5, nightlife: 0.5, photography: 0.5,
};

@Injectable()
export class TravelDNAService {
  private readonly logger = new Logger(TravelDNAService.name);
  private store = new Map<string, TravelDNAState>();

  /** Get or create DNA for a user */
  getDNA(userId: string): TravelDNAState {
    if (!this.store.has(userId)) {
      this.store.set(userId, {
        userId,
        profile: { ...DEFAULT_PROFILE },
        favoriteCuisines: {},
        favoriteActivities: {},
        preferredStartTime: '08:00',
        preferredPace: 'moderate',
        avgTripBudget: 500,
        totalTrips: 0,
        totalStops: 0,
        likedStops: 0,
        dislikedStops: 0,
        lastUpdate: new Date().toISOString(),
      });
    }
    return this.store.get(userId)!;
  }

  /** Learn from a generated plan — update DNA based on user's travel style choices */
  learnFromPlan(userId: string, travelStyles: string[], budget: number): void {
    const dna = this.getDNA(userId);
    dna.totalTrips++;

    // Increment scores based on selected styles (slow learning rate: 0.05)
    const LR = 0.05;
    const styleMap: Record<string, keyof TravelDNAProfile> = {
      FOODIE: 'foodie', ADVENTURE: 'adventure', LUXURY: 'luxury',
      BUDGET: 'budget', NATURE: 'nature', CULTURAL: 'culture',
      NIGHTLIFE: 'nightlife', PHOTOGRAPHY: 'photography',
    };
    for (const style of travelStyles) {
      const key = styleMap[style];
      if (key) dna.profile[key] = Math.min(1, dna.profile[key] + LR);
    }

    // Update moving average budget
    dna.avgTripBudget = (dna.avgTripBudget * (dna.totalTrips - 1) + budget) / dna.totalTrips;
    dna.lastUpdate = new Date().toISOString();
  }

  /** Learn from stop feedback — likes/dislikes */
  learnFromFeedback(userId: string, stopCategories: string[], liked: boolean): void {
    const dna = this.getDNA(userId);
    const LR = 0.08;
    const catMap: Record<string, keyof TravelDNAProfile> = {
      BREAKFAST: 'foodie', LUNCH: 'foodie', DINNER: 'foodie', CAFE_STOP: 'foodie',
      TOURIST_ATTRACTION: 'culture', HIDDEN_GEM: 'adventure',
      PHOTO_SPOT: 'photography', NIGHT_ACTIVITY: 'nightlife',
      NATURE: 'nature', SHOPPING: 'luxury',
    };

    for (const cat of stopCategories) {
      const key = catMap[cat];
      if (key) {
        dna.profile[key] = liked
          ? Math.min(1, dna.profile[key] + LR)
          : Math.max(0, dna.profile[key] - LR);
      }
    }

    if (liked) dna.likedStops++; else dna.dislikedStops++;
    dna.totalStops++;
    dna.lastUpdate = new Date().toISOString();
  }

  /** Update preferred pace based on stops-per-day */
  learnPace(userId: string, stopsPerDay: number): void {
    const dna = this.getDNA(userId);
    if (stopsPerDay <= 4) dna.preferredPace = 'relaxed';
    else if (stopsPerDay <= 7) dna.preferredPace = 'moderate';
    else dna.preferredPace = 'packed';
  }

  /** Get top N style recommendations based on profile scores */
  getTopStyles(userId: string, n = 3): string[] {
    const dna = this.getDNA(userId);
    return Object.entries(dna.profile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k.toUpperCase());
  }

  /** Get personalized summary for AI prompt context */
  getAIContext(userId: string): string {
    const dna = this.getDNA(userId);
    const top = this.getTopStyles(userId, 3);
    return `User DNA: ${top.join(', ')} enthusiast. Pace: ${dna.preferredPace}. Avg budget: RM ${Math.round(dna.avgTripBudget)}. ${dna.totalTrips} trips planned.`;
  }

  /** Merge DNA from frontend localStorage sync */
  mergeExternalDNA(userId: string, externalDNA: Partial<TravelDNAState>): void {
    const dna = this.getDNA(userId);
    if (externalDNA.profile) {
      for (const key of Object.keys(dna.profile)) {
        dna.profile[key as keyof TravelDNAProfile] =
          (dna.profile[key as keyof TravelDNAProfile] + (externalDNA.profile[key as keyof TravelDNAProfile] ?? 0.5)) / 2;
      }
    }
    if (externalDNA.preferredPace) dna.preferredPace = externalDNA.preferredPace;
    if (externalDNA.avgTripBudget) dna.avgTripBudget = externalDNA.avgTripBudget;
    dna.lastUpdate = new Date().toISOString();
  }

  /** Export DNA for frontend localStorage */
  exportDNA(userId: string): TravelDNAState {
    return this.getDNA(userId);
  }
}

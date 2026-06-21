import { Injectable } from '@nestjs/common';

export type SubscriptionTier = 'FREE' | 'PRO' | 'FAMILY' | 'BUSINESS';

interface TierLimits {
  plansPerMonth: number;
  aiModel: string;
  photoCount: number;
  offlineAccess: boolean;
  adFree: boolean;
  collaborativeUsers: number;
  exportFormats: string[];
  priorityQueue: boolean;
}

const TIERS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    plansPerMonth: 3,
    aiModel: 'rule-based',
    photoCount: 5,
    offlineAccess: false,
    adFree: false,
    collaborativeUsers: 1,
    exportFormats: [],
    priorityQueue: false,
  },
  PRO: {
    plansPerMonth: 30,
    aiModel: 'gpt-4o',
    photoCount: 20,
    offlineAccess: true,
    adFree: true,
    collaborativeUsers: 5,
    exportFormats: ['PDF', 'Google Maps', 'Calendar'],
    priorityQueue: true,
  },
  FAMILY: {
    plansPerMonth: 100,
    aiModel: 'gpt-4o',
    photoCount: 20,
    offlineAccess: true,
    adFree: true,
    collaborativeUsers: 6,
    exportFormats: ['PDF', 'Google Maps', 'Calendar', 'Excel'],
    priorityQueue: true,
  },
  BUSINESS: {
    plansPerMonth: 1000,
    aiModel: 'gpt-4o',
    photoCount: 30,
    offlineAccess: true,
    adFree: true,
    collaborativeUsers: 50,
    exportFormats: ['PDF', 'Google Maps', 'Calendar', 'Excel', 'API'],
    priorityQueue: true,
  },
};

const PRICING: Record<SubscriptionTier, { monthly: number; yearly: number }> = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 19.90, yearly: 199 },
  FAMILY: { monthly: 34.90, yearly: 349 },
  BUSINESS: { monthly: 99.90, yearly: 999 },
};

export interface BookingLink {
  type: 'hotel' | 'activity' | 'transport' | 'restaurant';
  provider: string;
  url: string;
  price?: number;
  currency: string;
  commissionRate: number;
  estimatedCommission: number;
}

@Injectable()
export class MonetizationService {
  /** Get tier limits for a user */
  getTierLimits(tier: SubscriptionTier = 'FREE'): TierLimits {
    return TIERS[tier];
  }

  /** Get pricing for a tier */
  getPricing(tier: SubscriptionTier) {
    return PRICING[tier];
  }

  /** Check if user can generate more plans this month */
  canGenerate(tier: SubscriptionTier, plansThisMonth: number): boolean {
    return plansThisMonth < TIERS[tier].plansPerMonth;
  }

  /** Generate affiliate booking links for a stop */
  generateBookingLinks(
    placeName: string,
    destination: string,
    category: string,
  ): BookingLink[] {
    const links: BookingLink[] = [];
    const encoded = encodeURIComponent(`${placeName} ${destination}`);

    // Hotel booking (Booking.com affiliate)
    if (category === 'HOTEL' || !category) {
      links.push({
        type: 'hotel',
        provider: 'Booking.com',
        url: `https://www.booking.com/searchresults.html?ss=${encoded}&aid=EXPLOREMY_AID`,
        currency: 'MYR',
        commissionRate: 0.10,
        estimatedCommission: 0,
      });
      links.push({
        type: 'hotel',
        provider: 'Agoda',
        url: `https://www.agoda.com/search?q=${encoded}&cid=EXPLOREMY_CID`,
        currency: 'MYR',
        commissionRate: 0.12,
        estimatedCommission: 0,
      });
    }

    // Activity booking (Klook affiliate)
    links.push({
      type: 'activity',
      provider: 'Klook',
      url: `https://www.klook.com/search/?keyword=${encoded}&aid=EXPLOREMY`,
      currency: 'MYR',
      commissionRate: 0.15,
      estimatedCommission: 0,
    });

    // Transport (Grab deep link)
    links.push({
      type: 'transport',
      provider: 'Grab',
      url: `https://redirect.grab.com/?destination=${encoded}&affiliate=EXPLOREMY`,
      currency: 'MYR',
      commissionRate: 0.05,
      estimatedCommission: 0,
    });

    // Restaurant (Eatigo)
    links.push({
      type: 'restaurant',
      provider: 'Eatigo',
      url: `https://eatigo.com/my/en/search?q=${encoded}`,
      currency: 'MYR',
      commissionRate: 0.08,
      estimatedCommission: 0,
    });

    return links;
  }

  /** Calculate projected revenue from a plan */
  projectRevenue(stops: Array<{ category: string; estimatedSpend: number; placeName: string }>, destination: string) {
    let totalCommission = 0;
    const breakdown: any[] = [];

    for (const stop of stops) {
      const links = this.generateBookingLinks(stop.placeName, destination, stop.category);
      for (const link of links) {
        const commission = stop.estimatedSpend * link.commissionRate;
        totalCommission += commission;
        breakdown.push({
          place: stop.placeName,
          type: link.type,
          provider: link.provider,
          spend: stop.estimatedSpend,
          rate: link.commissionRate,
          commission: Math.round(commission * 100) / 100,
        });
      }
    }

    return {
      totalProjectedCommission: Math.round(totalCommission * 100) / 100,
      currency: 'MYR',
      breakdown: breakdown.slice(0, 20), // Top 20
    };
  }

  /** Get upsell messaging based on usage */
  getUpsellMessage(tier: SubscriptionTier, plansThisMonth: number): string | null {
    if (tier === 'FREE' && plansThisMonth >= 2) {
      return 'You have 1 plan left this month. Upgrade to PRO for unlimited plans.';
    }
    if (tier === 'FREE' && plansThisMonth >= 3) {
      return 'You reached your free limit! Upgrade to PRO for RM 19.90/month.';
    }
    return null;
  }
}

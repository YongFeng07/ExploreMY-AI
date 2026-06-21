import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

export interface ShareCard {
  shareToken: string;
  shareUrl: string;
  title: string;
  destination: string;
  totalCost: number;
  totalStops: number;
  dayCount: number;
  topPhoto: string;
  platforms: {
    whatsapp: string;
    twitter: string;
    telegram: string;
    copyLink: string;
  };
}

@Injectable()
export class ShareService {
  /** Generate a share card for a plan */
  generateShareCard(plan: {
    id?: string;
    title: string;
    destination: string;
    totalCost: number;
    totalStops: number;
    days?: any[];
    shareToken?: string;
  }): ShareCard {
    const token = plan.shareToken || randomBytes(6).toString('base64url');
    const shareUrl = `https://exploremy.ai/trip/${token}`;
    const dayCount = plan.days?.length || 2;
    const topPhoto = plan.days?.[0]?.stops?.[0]?.photoUrl || '';

    const shareText = encodeURIComponent(
      `✨ ${plan.title}\n📍 ${plan.destination} · ${dayCount} days · ${plan.totalStops} stops\n💰 RM ${Math.round(plan.totalCost)}\n\nPlan your weekend in 10 seconds:`,
    );

    return {
      shareToken: token,
      shareUrl,
      title: plan.title,
      destination: plan.destination,
      totalCost: Math.round(plan.totalCost),
      totalStops: plan.totalStops,
      dayCount,
      topPhoto,
      platforms: {
        whatsapp: `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`,
        copyLink: shareUrl,
      },
    };
  }

  /** Track share analytics */
  trackShare(planId: string, platform: string): void {
    // In production: log to analytics DB
    console.log(`[Share] Plan ${planId} shared on ${platform}`);
  }

  /** Track clone (viral loop) */
  trackClone(originalPlanId: string, newPlanId: string): void {
    console.log(`[Viral] Plan ${newPlanId} cloned from ${originalPlanId}`);
  }
}

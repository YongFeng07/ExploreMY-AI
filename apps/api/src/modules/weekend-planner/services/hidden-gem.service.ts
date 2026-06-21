import { Injectable } from '@nestjs/common';

interface GemScoreInput {
  reviewCount: number;
  rating: number;
  photoCount: number;
  distanceFromCenterKm: number;
  category: string;
  hasLocalReviews: boolean;
  instagramTags: number;
}

interface GemScore {
  qualityScore: number;
  exposureScore: number;
  localRatioScore: number;
  uniquenessScore: number;
  compositeScore: number;
  isHiddenGem: boolean;
  confidence: number;
}

@Injectable()
export class HiddenGemService {
  /**
   * Score a place for hidden gem potential.
   * Hidden gems: high quality + low exposure + local character + uniqueness
   */
  score(input: GemScoreInput): GemScore {
    // Quality: weighted rating with Bayesian prior (avoid small-sample bias)
    const R = input.rating;
    const v = input.reviewCount;
    const C = 3.8; // global average rating
    const m = 20;   // minimum reviews for confidence
    const qualityScore = (v > 0) ? (R * v + C * m) / (v + m) / 5 : 0.5;

    // Exposure: inverse of review count (few reviews = more hidden)
    // Normalized: 10 reviews → 0.9, 100 reviews → 0.5, 1000 reviews → 0.1
    const exposureScore = Math.max(0, Math.min(1, 1 - Math.log10(Math.max(v, 1)) / 4));

    // Local ratio: heuristic — smaller review count + non-English reviews = local
    const localRatioScore = input.hasLocalReviews ? 0.8 : 0.3;

    // Uniqueness: rare category in area, distance from center
    const uniquenessScore = Math.min(1, (input.distanceFromCenterKm / 8) * 0.5 + 0.4);

    // Composite (weighted)
    const compositeScore =
      qualityScore * 0.35 +
      exposureScore * 0.30 +
      localRatioScore * 0.15 +
      uniquenessScore * 0.20;

    // Thresholds
    const isHiddenGem = compositeScore > 0.55 && v < 200 && R >= 4.0;

    return {
      qualityScore: Math.round(qualityScore * 100) / 100,
      exposureScore: Math.round(exposureScore * 100) / 100,
      localRatioScore: Math.round(localRatioScore * 100) / 100,
      uniquenessScore: Math.round(uniquenessScore * 100) / 100,
      compositeScore: Math.round(compositeScore * 100) / 100,
      isHiddenGem,
      confidence: Math.min(1, v / 30),
    };
  }

  /**
   * Batch score all stops in a plan and mark hidden gems
   */
  scoreStops(stops: Array<{
    rating?: number;
    reviewCount?: number;
    photos?: string[];
    category?: string;
    distanceFromCenterKm?: number;
  }>): void {
    for (const stop of stops) {
      const score = this.score({
        reviewCount: (stop as any).reviewCount ?? 10,
        rating: stop.rating ?? 4.0,
        photoCount: (stop.photos?.length ?? 0),
        distanceFromCenterKm: (stop as any).distanceFromCenterKm ?? 3,
        category: stop.category ?? 'OTHER',
        hasLocalReviews: (stop as any).reviewCount < 50,
        instagramTags: 0,
      });

      (stop as any).hiddenGemScore = score.compositeScore;
      (stop as any).isHiddenGem = score.isHiddenGem;
    }
  }
}

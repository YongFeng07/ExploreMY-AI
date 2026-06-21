import { Injectable } from '@nestjs/common';

interface PhotoScore {
  url: string;
  score: number;
  reason: string;
}

@Injectable()
export class PhotoCuratorService {
  /**
   * Score and rank photos based on available metadata heuristics.
   * In production, this would use a vision model (GPT-4 Vision or CLIP).
   * For now, we use reference-based heuristics.
   */
  curate(photos: string[], photoReferences: any[] = []): PhotoScore[] {
    if (!photos || photos.length === 0) return [];

    const scored: PhotoScore[] = photos.map((url, i) => {
      let score = 50; // Base score
      let reason = 'Standard photo';

      // Heuristic 1: First few photos from Google are usually the best
      if (i < 3) { score += 15; reason = 'Primary photo (high relevance)'; }
      else if (i < 6) { score += 8; reason = 'Secondary photo'; }
      else { score -= 5; reason = 'Additional photo'; }

      // Heuristic 2: Prefer photos with maxwidth=800 (higher resolution reference)
      if (url.includes('maxwidth=800')) { score += 10; }

      // Heuristic 3: Reference-based scoring
      if (photoReferences[i]) {
        const ref = photoReferences[i];
        // Google returns photo_reference with optional height/width
        if (ref.width && ref.height) {
          // Prefer landscape orientation for travel photos
          const ratio = ref.width / ref.height;
          if (ratio > 1.2 && ratio < 2.0) { score += 8; reason += ' | Landscape'; }
          // Penalize very small photos
          if (ref.width < 400) { score -= 15; reason += ' | Low resolution'; }
          // Bonus for high-res
          if (ref.width >= 800) { score += 5; reason += ' | High resolution'; }
        }
      }

      // Heuristic 4: Diversity — alternate between interior/exterior
      // (this is approximated; real version would use ML classification)

      return { url, score: Math.min(100, Math.max(0, Math.round(score))), reason };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Boost the top photo as "hero"
    if (scored.length > 0) {
      scored[0]!.score = 100;
      scored[0]!.reason = '🥇 Hero photo — best quality and relevance';
    }
    if (scored.length > 1) {
      scored[1]!.score = Math.min(100, scored[1]!.score + 5);
    }

    return scored;
  }

  /**
   * Get just the hero photo URL
   */
  getHeroPhoto(photos: string[], photoReferences?: any[]): string | null {
    const curated = this.curate(photos, photoReferences);
    return curated.length > 0 ? curated[0]!.url : null;
  }

  /**
   * Get top N photos
   */
  getTopPhotos(photos: string[], n: number, photoReferences?: any[]): string[] {
    const curated = this.curate(photos, photoReferences);
    return curated.slice(0, n).map(c => c.url);
  }

  /**
   * Apply curation to all stops in a plan
   */
  curatePlanStops(stops: Array<{
    photos?: string[];
    photoUrl?: string;
    photoReferences?: any[];
  }>): void {
    for (const stop of stops) {
      const allPhotos = stop.photos || [];
      if (allPhotos.length === 0) continue;

      const curated = this.curate(allPhotos, (stop as any).photoReferences || []);

      // Set hero photo as the main photoUrl
      if (curated.length > 0) {
        stop.photoUrl = curated[0]!.url;
      }

      // Reorder photos array by score
      stop.photos = curated.map(c => c.url);
    }
  }
}

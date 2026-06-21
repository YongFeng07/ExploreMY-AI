import { Injectable } from '@nestjs/common';

export interface ReviewItem {
  id: string; userId: string; userName: string; placeId: string;
  rating: number; title: string | null; content: string;
  tags: string[]; createdAt: string;
}

@Injectable()
export class ReviewsService {
  private reviews: ReviewItem[] = [
    { id: 'r1', userId: 'u1', userName: 'Ahmad Farid', placeId: 'pl-001', rating: 5, title: 'Best nasi lemak in Malaysia', content: 'The sambal is unmatched. I have been coming here for 20 years.', tags: ['local-favorite', 'must-try'], createdAt: '2026-06-10' },
    { id: 'r2', userId: 'u2', userName: 'Lisa Wong', placeId: 'pl-001', rating: 5, title: 'Worth the early wake-up', content: 'Got here at 7:30 AM. The rendang add-on is a game changer.', tags: ['halal', 'authentic'], createdAt: '2026-06-08' },
    { id: 'r3', userId: 'u3', userName: 'Tom Harris', placeId: 'pl-002', rating: 5, title: 'Food lover\'s paradise', content: 'Grilled stingray with sambal was the highlight. Incredible variety.', tags: ['night-market', 'seafood'], createdAt: '2026-06-12' },
    { id: 'r4', userId: 'u4', userName: 'James Chen', placeId: 'pl-003', rating: 5, title: 'Best flat white in KL', content: 'Their single-origin Ethiopian pour-over was exceptional.', tags: ['specialty-coffee', 'brunch'], createdAt: '2026-06-11' },
    { id: 'r5', userId: 'u5', userName: 'Sarah Tan', placeId: 'pl-005', rating: 5, title: 'Breathtaking!', content: 'The view from the sky bridge is incredible. Go early to avoid crowds.', tags: ['must-visit', 'photography'], createdAt: '2026-06-13' },
  ];

  getByPlace(placeId: string): ReviewItem[] {
    return this.reviews.filter((r) => r.placeId === placeId);
  }

  getStats(placeId: string) {
    const placeReviews = this.getByPlace(placeId);
    const avg = placeReviews.length > 0
      ? placeReviews.reduce((s, r) => s + r.rating, 0) / placeReviews.length
      : 0;
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    placeReviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });
    return { average: Math.round(avg * 10) / 10, total: placeReviews.length, distribution: dist };
  }

  create(review: Omit<ReviewItem, 'id' | 'createdAt'>): ReviewItem {
    const item: ReviewItem = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(item);
    return item;
  }
}

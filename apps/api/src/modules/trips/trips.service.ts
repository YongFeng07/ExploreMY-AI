import { Injectable } from '@nestjs/common';

export interface TripItem {
  id: string; userId: string; title: string; destinationCity: string;
  status: string; dayCount: number; budget: number | null; isAIGenerated: boolean;
  isPublic: boolean; coverEmoji: string; createdAt: string;
}

@Injectable()
export class TripsService {
  private trips: TripItem[] = [
    { id: 't1', userId: 'demo', title: 'Penang Food Adventure', destinationCity: 'George Town', status: 'PLANNED', dayCount: 3, budget: 500, isAIGenerated: true, isPublic: true, coverEmoji: '🍜', createdAt: '2026-06-01' },
    { id: 't2', userId: 'demo', title: 'KL Weekend Getaway', destinationCity: 'Kuala Lumpur', status: 'DRAFT', dayCount: 2, budget: 300, isAIGenerated: false, isPublic: false, coverEmoji: '🏙️', createdAt: '2026-06-05' },
  ];

  getUserTrips(userId: string): TripItem[] {
    return this.trips.filter((t) => t.userId === userId);
  }

  create(trip: Omit<TripItem, 'id' | 'createdAt'>): TripItem {
    const item: TripItem = { ...trip, id: `trip-${Date.now()}`, createdAt: new Date().toISOString() };
    this.trips.push(item);
    return item;
  }
}

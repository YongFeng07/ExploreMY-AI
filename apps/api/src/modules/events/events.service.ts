import { Injectable } from '@nestjs/common';

export interface EventItem {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  city: string;
  state?: string;
  country?: string;
  description?: string;
  photoUrl?: string;
  isVerified: boolean;
  lat?: number;
  lng?: number;
}

@Injectable()
export class EventsService {
  private events: EventItem[] = [
    {
      id: 'e1', name: 'Penang Food Festival',
      type: 'food_fair', startDate: '2026-07-15', endDate: '2026-07-17',
      city: 'George Town', state: 'Penang', country: 'Malaysia',
      description: 'A celebration of Penang\'s world-famous street food.',
      isVerified: true, lat: 5.4141, lng: 100.3288,
    },
    {
      id: 'e2', name: 'Rainforest World Music Festival',
      type: 'concert', startDate: '2026-07-20', endDate: '2026-07-22',
      city: 'Kuching', state: 'Sarawak', country: 'Malaysia',
      description: 'Three days of world music at Sarawak Cultural Village.',
      isVerified: true, lat: 1.7494, lng: 110.3262,
    },
    {
      id: 'e3', name: 'Thaipusam at Batu Caves',
      type: 'festival', startDate: '2026-02-04',
      city: 'Kuala Lumpur', state: 'Selangor', country: 'Malaysia',
      description: 'Hindu festival celebrated at the iconic Batu Caves.',
      isVerified: true, lat: 3.2374, lng: 101.6839,
    },
    {
      id: 'e4', name: 'Langkawi International Maritime & Aerospace Exhibition',
      type: 'exhibition', startDate: '2027-05-25', endDate: '2027-05-29',
      city: 'Langkawi', state: 'Kedah', country: 'Malaysia',
      description: 'One of the largest maritime and aerospace showcases in Asia-Pacific.',
      isVerified: true, lat: 6.3500, lng: 99.8000,
    },
  ];

  getUpcoming(page: number = 0, limit: number = 20) {
    const upcoming = this.events.filter(
      (e) => new Date(e.startDate) >= new Date(),
    );
    const paged = upcoming.slice(page * limit, (page + 1) * limit);
    return { data: paged, meta: { total: upcoming.length, page, limit } };
  }

  getNearby(lat: number, lng: number, radiusKm: number = 25, page: number = 0, limit: number = 20) {
    const nearby = this.events
      .filter((e) => {
        if (!e.lat || !e.lng) return false;
        const dLat = (e.lat - lat) * 111;
        const dLng = (e.lng - lng) * 111 * Math.cos(lat * Math.PI / 180);
        const dist = Math.sqrt(dLat ** 2 + dLng ** 2);
        return dist <= radiusKm;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const paged = nearby.slice(page * limit, (page + 1) * limit);
    return { data: paged, meta: { total: nearby.length, page, limit } };
  }

  getById(eventId: string): EventItem | null {
    return this.events.find((e) => e.id === eventId) || null;
  }
}

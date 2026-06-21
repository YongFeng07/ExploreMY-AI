import { Injectable, Logger } from '@nestjs/common';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCyohvWiwbAd2UbDpOW-9Os0_eIo8JQ_D8';

interface TransportInfo {
  mode: string; emoji: string; durationMin: number; costEstimate: number; available: boolean;
}

export interface EnrichedPlaceData {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  photos: string[];
  openingHours: string;
  isOpen: boolean;
  phone?: string;
  website?: string;
  googleUrl: string;
  priceLevel: number;
  distanceFromUser?: number;
  transportOptions?: TransportInfo[];
}

@Injectable()
export class PlaceEnrichmentService {
  private readonly logger = new Logger(PlaceEnrichmentService.name);
  private cache = new Map<string, EnrichedPlaceData>();

  async findPlace(placeName: string, lat: number, lng: number): Promise<string | null> {
    const ck = `find:${placeName}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    if (this.cache.has(ck)) return this.cache.get(ck)!.placeId;

    // Try exact match first, then progressively broader searches
    const attempts = [
      placeName,
      placeName.replace(/^(Best|Famous|Top|Local|Morning|Traditional|Fine|Hidden|Popular|Main)\s+/i, ''),
      placeName.replace(/^(Breakfast|Lunch|Dinner|Cafe|Restaurant|Spot|Walk|Park|Site|Gallery|Bar|Market)\s+/i, ''),
      placeName.split(' in ')[0] || placeName,
    ];

    for (const query of attempts) {
      if (!query || query.length < 3) continue;
      try {
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&locationbias=point:${lat},${lng}&key=${GOOGLE_KEY}`;
        const r = await (await fetch(url)).json();
        if (r.candidates?.[0]?.place_id) return r.candidates[0].place_id;
      } catch {}
    }
    return null;
  }

  async getPlaceDetails(placeId: string): Promise<EnrichedPlaceData | null> {
    if (this.cache.has(placeId)) return this.cache.get(placeId)!;
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,user_ratings_total,photos,opening_hours,formatted_phone_number,website,url,price_level,geometry&key=${GOOGLE_KEY}`;
      const data = await (await fetch(url)).json();
      if (!data.result) return null;
      const r = data.result;

      // Fetch up to 15 photos (Google returns max 10 per details call; make extra photo calls if needed)
      const photoRefs = (r.photos || []).slice(0, 15);
      const photos = photoRefs.map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${GOOGLE_KEY}`,
      );

      const enriched: EnrichedPlaceData = {
        placeId, name: r.name, address: r.formatted_address || '',
        lat: r.geometry?.location?.lat || 0, lng: r.geometry?.location?.lng || 0,
        rating: r.rating || 0, reviewCount: r.user_ratings_total || 0, photos,
        openingHours: r.opening_hours?.weekday_text?.join(' | ') || (r.opening_hours?.open_now ? 'Open now' : ''),
        isOpen: r.opening_hours?.open_now ?? false,
        phone: r.formatted_phone_number, website: r.website,
        googleUrl: r.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        priceLevel: r.price_level ?? 2,
      };
      this.cache.set(placeId, enriched);
      return enriched;
    } catch { return null; }
  }

  /** Calculate all possible transport modes between two points */
  calcTransport(fromLat: number, fromLng: number, toLat: number, toLng: number): TransportInfo[] {
    const d = this.haversineKm(fromLat, fromLng, toLat, toLng);
    return [
      { mode: '🚶 Walking', emoji: '🚶', durationMin: Math.round(d / 5 * 60), costEstimate: 0, available: d <= 3 },
      { mode: '🚕 Grab / Taxi', emoji: '🚕', durationMin: Math.max(3, Math.round(d / 30 * 60) + 3), costEstimate: Math.max(5, Math.round(5 + d * 1.5)), available: true },
      { mode: '🚗 Self Drive', emoji: '🚗', durationMin: Math.max(2, Math.round(d / 35 * 60) + 2), costEstimate: Math.max(1, Math.round(d * 0.4)), available: true },
      { mode: '🚇 LRT / MRT', emoji: '🚇', durationMin: Math.max(8, Math.round(d / 40 * 60) + 8), costEstimate: Math.max(3, Math.round(3 + d * 0.3)), available: d >= 1 && d <= 80 },
      { mode: '🚂 KTM Train', emoji: '🚂', durationMin: Math.round(d / 50 * 60) + 12, costEstimate: Math.round(5 + d * 0.2), available: d >= 5 && d <= 200 },
      { mode: '🚄 Bullet Train', emoji: '🚄', durationMin: Math.round(d / 150 * 60) + 20, costEstimate: Math.round(30 + d * 0.08), available: d >= 80 },
      { mode: '✈️ Flight', emoji: '✈️', durationMin: 60, costEstimate: Math.round(100 + d * 0.05), available: d >= 200 },
      { mode: '⛴️ Ferry / Boat', emoji: '⛴️', durationMin: Math.round(d / 20 * 60) + 15, costEstimate: Math.round(12 + d * 0.3), available: d >= 1 && d <= 50 },
    ];
  }

  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async enrichStops(
    stops: Array<{ placeName: string; placeId?: string; rating?: number; photoUrl?: string }>,
    destLat: number, destLng: number,
    userLat?: number, userLng?: number,
  ): Promise<EnrichedPlaceData[]> {
    const results: EnrichedPlaceData[] = [];
    let prevLat = destLat, prevLng = destLng;

    for (const stop of stops) {
      let placeId = stop.placeId;
      if (!placeId || placeId.startsWith('citydb-') || placeId.startsWith('fallback-') || placeId.startsWith('mem-stop-')) {
        const found = await this.findPlace(stop.placeName, destLat, destLng);
        if (found) placeId = found;
      }

      if (placeId) {
        const details = await this.getPlaceDetails(placeId);
        if (details) {
          // Add transport from previous stop
          details.transportOptions = this.calcTransport(prevLat, prevLng, details.lat, details.lng);
          // Add distance from user
          if (userLat !== undefined && userLng !== undefined && details.lat && details.lng) {
            details.distanceFromUser = Math.round(this.haversineKm(userLat, userLng, details.lat, details.lng) * 10) / 10;
          }
          results.push(details);
          stop.placeId = placeId;
          stop.rating = details.rating;
          stop.photoUrl = details.photos[0] || stop.photoUrl;
          (stop as any).photos = details.photos;
          (stop as any).transportOptions = details.transportOptions;
          (stop as any).distanceFromUser = details.distanceFromUser;
          (stop as any).lat = details.lat;
          (stop as any).lng = details.lng;
          (stop as any).address = details.address;
          prevLat = details.lat || prevLat;
          prevLng = details.lng || prevLng;
          continue;
        }
      }

      results.push({ placeId: placeId || '', name: stop.placeName, address: '', lat: 0, lng: 0, rating: stop.rating || 0, reviewCount: 0, photos: stop.photoUrl ? [stop.photoUrl] : [], openingHours: '', isOpen: false, googleUrl: '', priceLevel: 2 });
    }
    return results;
  }
}

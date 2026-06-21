'use client';

import { useState, useCallback, useRef } from 'react';

interface GooglePlace {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: google.maps.places.PlacePhoto[];
  geometry: { location: { lat: () => number; lng: () => number } };
  types: string[];
  opening_hours?: { open_now: boolean };
}

export interface PlaceResult {
  id: string; slug: string; name: string; category: string;
  rating: number; reviewCount: number; distance: number;
  priceLevel: number | null; photos: string[]; address: string;
  city: string; lat: number; lng: number;
  isOpen: boolean; isHiddenGem: boolean; isTrending: boolean;
}

function mapCategory(types: string[]): string {
  const t = types.join(' ');
  if (/restaurant|meal_takeaway|food/.test(t)) return 'FOOD';
  if (/cafe|coffee|bakery/.test(t)) return 'CAFE';
  if (/shopping_mall|department_store/.test(t)) return 'SHOPPING_MALL';
  if (/tourist_attraction|museum|park|amusement|zoo|aquarium|church|hindu_temple|mosque|place_of_worship/.test(t)) return 'ATTRACTION';
  if (/lodging|hotel/.test(t)) return 'HOTEL';
  return 'OTHER';
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGooglePlaces() {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  const initService = useCallback((map: google.maps.Map | null) => {
    if (!map || !window.google?.maps?.places) return;
    serviceRef.current = new google.maps.places.PlacesService(map);
  }, []);

  const searchNearby = useCallback((lat: number, lng: number, radius = 5000, category?: string | null) => {
    const service = serviceRef.current;
    if (!service) {
      // Fallback: use backend API
      const cat = category ? `&category=${category}` : '';
      fetch(`http://127.0.0.1:3001/api/v1/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}${cat}&limit=20`)
        .then(r => r.json()).then(j => {
          setResults(j.data ?? []);
          setLoading(false);
        }).catch(() => { setResults([]); setLoading(false); });
      setLoading(true);
      return;
    }

    setLoading(true);

    const typeMap: Record<string, string> = {
      FOOD: 'restaurant', CAFE: 'cafe', SHOPPING_MALL: 'shopping_mall', ATTRACTION: 'tourist_attraction',
    };
    const type = category ? typeMap[category] : undefined;

    const request: google.maps.places.PlaceSearchRequest = {
      location: new google.maps.LatLng(lat, lng),
      radius,
      type,
    };

    // For "all" — search multiple types
    if (!type) {
      const types = ['restaurant', 'cafe', 'shopping_mall', 'tourist_attraction'];
      const allResults: google.maps.places.PlaceResult[] = [];
      let completed = 0;

      types.forEach(t => {
        service.nearbySearch({ location: request.location, radius: Math.min(radius, 3000), type: t }, (res, status) => {
          completed++;
          if (status === google.maps.places.PlacesServiceStatus.OK && res) {
            allResults.push(...res);
          }
          if (completed === types.length) {
            const places = transformResults(allResults, lat, lng, radius);
            setResults(places);
            setLoading(false);
          }
        });
      });
    } else {
      service.nearbySearch(request, (res, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && res) {
          setResults(transformResults(res, lat, lng, radius));
        } else {
          // Fallback to backend
          fetch(`http://127.0.0.1:3001/api/v1/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}${category ? `&category=${category}` : ''}&limit=20`)
            .then(r => r.json()).then(j => setResults(j.data ?? [])).catch(() => setResults([]));
        }
        setLoading(false);
      });
    }
  }, []);

  return { results, loading, searchNearby, initService };
}

function transformResults(places: google.maps.places.PlaceResult[], userLat: number, userLng: number, radius: number): PlaceResult[] {
  return places
    .map(p => {
      const lat = p.geometry?.location?.lat();
      const lng = p.geometry?.location?.lng();
      if (!lat || !lng) return null;
      const dist = Math.round(haversine(userLat, userLng, lat, lng));
      if (dist > radius) return null;
      return {
        id: p.place_id!, slug: slugify(p.name!), name: p.name!,
        category: mapCategory(p.types ?? []),
        rating: p.rating ?? 0, reviewCount: p.user_ratings_total ?? 0,
        distance: dist, priceLevel: p.price_level ?? null,
        photos: p.photos ? [p.photos[0]!.getUrl({ maxWidth: 800 })] : [],
        address: p.vicinity ?? '', city: '', lat, lng,
        isOpen: !!p.opening_hours?.open_now,
        isHiddenGem: (p.user_ratings_total ?? 0) < 500 && (p.rating ?? 0) >= 4.3,
        isTrending: (p.user_ratings_total ?? 0) > 1000,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.distance - b!.distance)
    .slice(0, 20) as PlaceResult[];
}

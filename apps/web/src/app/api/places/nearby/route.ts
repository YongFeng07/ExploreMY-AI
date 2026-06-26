import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const CATEGORY_MAP: Record<string, string> = {
  FOOD: 'restaurant', CAFE: 'cafe', TOURIST_ATTRACTION: 'tourist_attraction',
  SHOPPING_MALL: 'shopping_mall', NATURE: 'park', HOTEL: 'lodging', NIGHTLIFE: 'night_club',
};
const ALL_TYPES = ['restaurant', 'cafe', 'tourist_attraction', 'shopping_mall', 'park', 'night_club'];

function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchPage(lat: number, lng: number, radius: string, type: string, token?: string): Promise<{ results: any[]; nextToken: string | null }> {
  const params = new URLSearchParams({ location: `${lat},${lng}`, radius, key: GOOGLE_KEY, type });
  if (token) { params.delete('location'); params.delete('radius'); params.delete('type'); params.set('pagetoken', token); }
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const json = await res.json();
  return { results: json.results || [], nextToken: json.next_page_token || null };
}

function mapPlace(p: any, lat: number, lng: number): any {
  const pLat = p.geometry?.location?.lat;
  const pLng = p.geometry?.location?.lng;
  const distMeters = pLat && pLng ? Math.round(calcDist(lat, lng, pLat, pLng) * 1000) : 0;
  return {
    id: p.place_id, name: p.name, lat: pLat, lng: pLng, address: p.vicinity,
    distance: distMeters,
    rating: p.rating || 0, userRatingsTotal: p.user_ratings_total || 0,
    photos: (p.photos || []).slice(0, 4).map((ph: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ph.photo_reference}&key=${GOOGLE_KEY}`
    ),
    category: p.types?.[0] || 'unknown', openNow: p.opening_hours?.open_now,
    priceLevel: p.price_level, types: p.types,
  };
}

async function getAllPages(lat: number, lng: number, radius: string, type: string): Promise<any[]> {
  const all: any[] = [];
  let token: string | null = null;

  // Page 1
  const p1 = await fetchPage(lat, lng, radius, type);
  all.push(...p1.results);
  token = p1.nextToken;

  // Page 2 — wait 2s for token to activate
  if (token && all.length >= 20) {
    await new Promise(r => setTimeout(r, 2500));
    const p2 = await fetchPage(lat, lng, radius, type, token);
    if (p2.results.length > 0) {
      all.push(...p2.results);
      token = p2.nextToken;
    } else { token = null; }
  }

  // Page 3
  if (token && all.length >= 40) {
    await new Promise(r => setTimeout(r, 2500));
    const p3 = await fetchPage(lat, lng, radius, type, token);
    if (p3.results.length > 0) all.push(...p3.results);
  }

  return all;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '3.147');
  const lng = parseFloat(searchParams.get('lng') ?? '101.708');
  const radius = searchParams.get('radius') ?? '20000';
  const category = searchParams.get('category') ?? '';

  if (!GOOGLE_KEY) return NextResponse.json({ data: [], meta: { total: 0 } });

  try {
    let allResults: any[] = [];

    if (category && CATEGORY_MAP[category]) {
      allResults = await getAllPages(lat, lng, radius, CATEGORY_MAP[category]);
    } else {
      // "All" — parallel search across 6 types, 10 each
      const typeResults = await Promise.all(
        ALL_TYPES.map(type => fetchPage(lat, lng, radius, type).then(p => p.results.slice(0, 12)).catch(() => []))
      );
      for (let i = 0; i < 12; i++) {
        for (const results of typeResults) {
          if (results[i]) allResults.push(results[i]);
        }
      }
    }

    // Category type filters — ensure correct classification
    const CATEGORY_FILTERS: Record<string, string[]> = {
      FOOD: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'bakery'],
      CAFE: ['cafe', 'bakery', 'coffee_shop'],
      TOURIST_ATTRACTION: ['tourist_attraction', 'museum', 'art_gallery', 'zoo', 'aquarium', 'amusement_park', 'place_of_worship', 'hindu_temple', 'mosque', 'church', 'stadium', 'park'],
      SHOPPING_MALL: ['shopping_mall', 'department_store', 'clothing_store', 'jewelry_store', 'shoe_store', 'shopping'],
      NATURE: ['park', 'natural_feature', 'beach', 'waterfall', 'mountain', 'forest', 'lake', 'river'],
      HOTEL: ['lodging', 'hotel', 'motel', 'resort', 'spa', 'guest_house', 'hostel'],
      NIGHTLIFE: ['night_club', 'bar', 'casino', 'pub', 'liquor_store'],
    };
    const genericTypes = ['locality', 'political', 'administrative_area_level_1', 'administrative_area_level_2', 'country', 'route', 'postal_code', 'premise', 'establishment', 'point_of_interest', 'sublocality'];

    const seen = new Set<string>();
    const places = allResults
      .map(p => mapPlace(p, lat, lng))
      .filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        // Filter out generic types
        const hasOnlyGeneric = p.types?.every((t: string) => genericTypes.includes(t));
        if (hasOnlyGeneric) return false;
        // Category-specific filter — check primary type matches
        if (category && CATEGORY_FILTERS[category]) {
          const allowed = CATEGORY_FILTERS[category];
          // Also define what to EXCLUDE for this category
          const EXCLUDE_FOR: Record<string, string[]> = {
            FOOD: ['lodging', 'hotel', 'motel', 'resort', 'spa', 'night_club', 'bar', 'shopping_mall'],
            CAFE: ['lodging', 'hotel', 'night_club', 'shopping_mall'],
            TOURIST_ATTRACTION: ['lodging', 'night_club'],
            NATURE: ['lodging', 'hotel', 'shopping_mall', 'night_club', 'restaurant'],
            HOTEL: ['restaurant', 'cafe', 'night_club', 'shopping_mall', 'park'],
            NIGHTLIFE: ['lodging', 'hotel', 'shopping_mall', 'park'],
            SHOPPING_MALL: ['lodging', 'hotel', 'night_club', 'park'],
          };
          const exclude = EXCLUDE_FOR[category] || [];
          const hasExcluded = p.types?.some((t: string) => exclude.includes(t));
          const hasAllowed = p.types?.some((t: string) => allowed.includes(t));
          if (hasExcluded || !hasAllowed) return false;
        }
        return true;
      })
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ data: places, meta: { total: places.length, lat, lng } });
  } catch (err) {
    console.error('Places nearby error:', err);
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }
}

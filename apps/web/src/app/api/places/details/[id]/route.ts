import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const placeId = params.id;

  if (!GOOGLE_KEY || !placeId) {
    return NextResponse.json({ data: null });
  }

  try {
    const fields = [
      'name', 'formatted_address', 'formatted_phone_number', 'rating',
      'user_ratings_total', 'opening_hours', 'website', 'price_level',
      'photos', 'reviews', 'types', 'geometry', 'url', 'editorial_summary',
      'wheelchair_accessible_entrance', 'business_status',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${GOOGLE_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();

    if (!json.result) {
      return NextResponse.json({ data: null });
    }

    const p = json.result;
    const data = {
      id: placeId,
      name: p.name || '',
      address: p.formatted_address || '',
      phone: p.formatted_phone_number || '',
      rating: p.rating || 0,
      reviewCount: p.user_ratings_total || 0,
      openNow: p.opening_hours?.open_now,
      openingHours: p.opening_hours?.weekday_text?.join('\n') || '',
      website: p.website || '',
      priceLevel: p.price_level,
      url: p.url || '',
      types: p.types || [],
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      summary: p.editorial_summary?.overview || '',
      wheelchair: p.wheelchair_accessible_entrance?.wheelchair_accessible_entrance,
      businessStatus: p.business_status || '',
      photos: (p.photos || []).slice(0, 10).map((ph: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_KEY}`
      ),
      reviews: (p.reviews || []).slice(0, 5).map((r: any) => ({
        author: r.author_name || '',
        avatar: r.profile_photo_url || '',
        rating: r.rating || 0,
        text: r.text || '',
        time: r.relative_time_description || '',
      })),
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: null });
  }
}

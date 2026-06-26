import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!GOOGLE_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

  try {
    const qs = new URLSearchParams({
      place_id: slug,
      key: GOOGLE_KEY,
      language: 'en',
      fields: 'name,formatted_address,formatted_phone_number,website,geometry,rating,user_ratings_total,photos,opening_hours,price_level,types,reviews,editorial_summary,url,international_phone_number,utc_offset,adr_address,business_status,delivery,dine_in,curbside_pickup',
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${qs.toString()}`,
      { signal: AbortSignal.timeout(10000) }
    );
    const json = await res.json();
    const p = json.result;

    if (!p) return NextResponse.json({ error: 'Place not found' }, { status: 404 });

    const photos = (p.photos || []).slice(0, 10).map((ph: any) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ph.photo_reference}&key=${GOOGLE_KEY}`
    );

    const place = {
      id: slug,
      name: p.name,
      address: p.formatted_address,
      phone: p.formatted_phone_number || p.international_phone_number,
      website: p.website,
      googleUrl: p.url,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      rating: p.rating || 0,
      userRatingsTotal: p.user_ratings_total || 0,
      priceLevel: p.price_level,
      photos,
      openNow: p.opening_hours?.open_now,
      hours: p.opening_hours?.weekday_text || [],
      types: p.types || [],
      reviews: (p.reviews || []).slice(0, 5).map((r: any) => ({
        author: r.author_name,
        avatar: r.profile_photo_url,
        rating: r.rating,
        text: r.text?.substring(0, 500),
        time: r.relative_time_description,
      })),
      summary: p.editorial_summary?.overview || '',
      businessStatus: p.business_status,
      delivery: p.delivery,
      dineIn: p.dine_in,
    };

    return NextResponse.json({ data: place });
  } catch {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }
}

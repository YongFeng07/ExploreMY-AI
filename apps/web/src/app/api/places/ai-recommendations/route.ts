import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') ?? '3.139';
  const lng = searchParams.get('lng') ?? '101.6869';

  if (!GOOGLE_KEY) {
    return NextResponse.json({ data: { greeting: 'Good day! 👋', forYou: [], reasonForYou: 'Discover what\'s nearby' } });
  }

  try {
    const params = new URLSearchParams({ location: `${lat},${lng}`, radius: '10000', key: GOOGLE_KEY, rankby: 'prominence' });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    const places = (json.results || []).slice(0, 6).map((p: any) => ({
      id: p.place_id, name: p.name, lat: p.geometry?.location?.lat, lng: p.geometry?.location?.lng,
      rating: p.rating || 0, photos: p.photos?.map((ph: any) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${ph.photo_reference}&key=${GOOGLE_KEY}`) || [], reason: p.vicinity,
    }));
    return NextResponse.json({ data: { greeting: 'Here\'s what\'s nearby 👋', forYou: places, reasonForYou: 'Popular spots worth checking out' } });
  } catch {
    return NextResponse.json({ data: { greeting: 'Good day! 👋', forYou: [], reasonForYou: 'Discover what\'s nearby' } });
  }
}

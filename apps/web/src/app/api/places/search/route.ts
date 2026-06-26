import { NextResponse, type NextRequest } from 'next/server';

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const lat = searchParams.get('lat') || '3.139';
  const lng = searchParams.get('lng') || '101.6869';
  const limit = parseInt(searchParams.get('limit') || '40', 10);

  if (!GOOGLE_KEY || !q) {
    return NextResponse.json({ data: [], meta: { total: 0, query: q } });
  }

  try {
    // Append "Malaysia" if not already in query for better results
    const query = q.toLowerCase().includes('malaysia') ? q : `${q} Malaysia`;

    // Try Text Search first (best for specific queries)
    const textParams = new URLSearchParams({
      query,
      location: `${lat},${lng}`,
      radius: '100000', // 100km radius for broad coverage
      key: GOOGLE_KEY,
      language: 'en',
      region: 'my',
    });

    const textRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${textParams.toString()}`,
      { signal: AbortSignal.timeout(12000) }
    );
    const textJson = await textRes.json();
    let results = textJson.results || [];

    // If few results, try Nearby Search as fallback with larger radius
    if (results.length < 5) {
      const nearbyParams = new URLSearchParams({
        location: `${lat},${lng}`,
        radius: '50000',
        keyword: q,
        key: GOOGLE_KEY,
        language: 'en',
      });
      const nearbyRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${nearbyParams.toString()}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const nearbyJson = await nearbyRes.json();
      const nearbyResults = nearbyJson.results || [];

      // Merge and deduplicate
      const ids = new Set(results.map((r: any) => r.place_id));
      for (const r of nearbyResults) {
        if (!ids.has(r.place_id)) { results.push(r); ids.add(r.place_id); }
      }
    }

    // If STILL few results, try without location bias (search all Malaysia)
    if (results.length < 3) {
      const malaysiaParams = new URLSearchParams({
        query: `${q} in Malaysia`,
        key: GOOGLE_KEY,
        language: 'en',
        region: 'my',
      });
      const myRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?${malaysiaParams.toString()}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const myJson = await myRes.json();
      const myResults = myJson.results || [];
      const ids = new Set(results.map((r: any) => r.place_id));
      for (const r of myResults) {
        if (!ids.has(r.place_id)) { results.push(r); ids.add(r.place_id); }
      }
    }

    // Map to clean format
    const places = results.slice(0, limit).map((p: any) => {
      const pLat = p.geometry?.location?.lat;
      const pLng = p.geometry?.location?.lng;
      // Calculate rough distance
      const dLat = (pLat - parseFloat(lat)) * 111320;
      const dLng = (pLng - parseFloat(lng)) * 111320 * Math.cos(parseFloat(lat) * Math.PI / 180);
      const distMeters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

      return {
        id: p.place_id,
        slug: p.place_id,
        name: p.name,
        lat: pLat,
        lng: pLng,
        address: p.formatted_address || p.vicinity || '',
        city: p.formatted_address?.split(',').slice(-2, -1)[0]?.trim() || 'Malaysia',
        distance: distMeters,
        rating: p.rating || 0,
        reviewCount: p.user_ratings_total || 0,
        priceLevel: p.price_level || null,
        photos: (p.photos || []).slice(0, 4).map((ph: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${ph.photo_reference}&key=${GOOGLE_KEY}`
        ),
        category: p.types?.[0] || 'unknown',
        isOpen: p.opening_hours?.open_now,
        isHiddenGem: (p.user_ratings_total || 0) < 100 && (p.rating || 0) >= 4.3,
        isTrending: false,
        openingHours: p.opening_hours?.open_now ? 'Open now' : 'Check hours',
      };
    });

    // Sort by distance
    places.sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));

    return NextResponse.json({
      data: places,
      meta: { total: places.length, query: q, lat: parseFloat(lat), lng: parseFloat(lng) },
    });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ data: [], meta: { total: 0, query: q } });
  }
}

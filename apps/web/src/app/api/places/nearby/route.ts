import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') ?? '3.147';
  const lng = searchParams.get('lng') ?? '101.708';
  const radius = searchParams.get('radius') ?? '5000';
  const category = searchParams.get('category') ?? '';
  const limit = searchParams.get('limit') ?? '20';

  const params = new URLSearchParams({ lat, lng, radius, limit });
  if (category) params.set('category', category);

  try {
    const res = await fetch(`http://localhost:3001/api/v1/places/nearby?${params.toString()}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }
}

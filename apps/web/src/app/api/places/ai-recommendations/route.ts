import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') ?? '3.139';
  const lng = searchParams.get('lng') ?? '101.6869';

  try {
    const res = await fetch(`http://localhost:3001/api/v1/places/ai-recommendations?lat=${lat}&lng=${lng}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: { greeting: 'Good day! 👋', forYou: [], reasonForYou: 'Discover what\'s nearby' } });
  }
}

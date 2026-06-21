import { NextResponse, type NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const res = await fetch(`http://localhost:3001/api/v1/places/${slug}`);
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'Place not found' }, { status: 404 });
  }
}

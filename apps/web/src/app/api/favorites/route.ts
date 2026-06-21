import { NextResponse, type NextRequest } from 'next/server';

const BACKEND = 'http://localhost:3001/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ?? 'demo-user';
  const placeId = searchParams.get('placeId');
  const action = searchParams.get('action'); // 'check'

  try {
    if (action === 'check' && placeId) {
      const res = await fetch(`${BACKEND}/favorites/${userId}/check/${placeId}`);
      return NextResponse.json(await res.json());
    }
    const res = await fetch(`${BACKEND}/favorites/${userId}`);
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: body.userId ?? 'demo-user', ...body }),
    });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: null, error: 'Backend unavailable' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') ?? 'demo-user';
  const placeId = searchParams.get('placeId') ?? '';

  try {
    const res = await fetch(`${BACKEND}/favorites/${userId}/${placeId}`, { method: 'DELETE' });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ data: { removed: false } }, { status: 503 });
  }
}

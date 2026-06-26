import { NextResponse, type NextRequest } from 'next/server';

// Favorites are stored in localStorage on the client side.
// This API route exists to prevent 404 errors from existing frontend calls.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '';
  const action = searchParams.get('action');
  const placeId = searchParams.get('placeId');

  // Return empty — client manages favorites via localStorage
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ data: { id: 'local_' + Date.now() } });
}

export async function DELETE() {
  return NextResponse.json({ success: true });
}

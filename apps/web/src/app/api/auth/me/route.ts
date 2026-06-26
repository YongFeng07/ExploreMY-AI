import { NextResponse } from 'next/server';

// Return user data from Clerk session
export async function GET() {
  // Empty — client-side auth handles this via Clerk.
  // This route exists to prevent 404 errors from existing frontend calls.
  return NextResponse.json({ data: null, message: 'Use Clerk client-side hooks for user data' });
}

export async function PATCH() {
  return NextResponse.json({ data: null });
}

export async function DELETE() {
  return NextResponse.json({ data: null });
}

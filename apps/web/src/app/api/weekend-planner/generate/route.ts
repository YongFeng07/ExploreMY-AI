import { NextResponse } from 'next/server';

const API_BASE = process.env.NESTJS_API_URL ?? 'http://127.0.0.1:3001/api/v1';
const DEMO_USER_ID = 'demo-user-001';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['destination', 'destinationLat', 'destinationLng', 'startDate', 'endDate', 'planType', 'budget', 'transportMode', 'groupType', 'travelStyles'];
    for (const field of required) {
      if (body[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Forward to NestJS API
    const res = await fetch(`${API_BASE}/weekend-planner/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': DEMO_USER_ID,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('NestJS API error:', res.status, errText);
      return NextResponse.json(
        { error: `Backend generation failed (${res.status})` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Weekend planner BFF error:', err);
    return NextResponse.json(
      { error: 'Internal server error during plan generation' },
      { status: 500 },
    );
  }
}

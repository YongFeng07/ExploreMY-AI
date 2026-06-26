import { NextResponse } from 'next/server';

// Mock roadtrip data - Google Maps Directions would need billing
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  kualalumpur: { lat: 3.139, lng: 101.6869 },
  penang: { lat: 5.4141, lng: 100.3288 },
  melaka: { lat: 2.1896, lng: 102.2501 },
  johor: { lat: 1.4927, lng: 103.7414 },
  ipoh: { lat: 4.5975, lng: 101.0901 },
  langkawi: { lat: 6.35, lng: 99.8 },
  kuantan: { lat: 3.7634, lng: 103.2202 },
  kota_kinabalu: { lat: 5.9804, lng: 116.0735 },
  kuching: { lat: 1.5535, lng: 110.3593 },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originLat, originLng, destLat, destLng, vehicleType = 'car_midsize', dayCount = 2, pax = 2, style = 'FASTEST' } = body;

    // Calculate rough distance using Haversine
    const R = 6371000;
    const dLat = (destLat - originLat) * Math.PI / 180;
    const dLng = (destLng - originLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Style multipliers
    const styleMultiplier = style === 'SCENIC' ? 1.4 : style === 'FOODIE' ? 1.2 : 1.0;

    const totalDistance = Math.round(distance * 2 * styleMultiplier * dayCount);
    const avgSpeed = vehicleType === 'car_mpv' ? 60 : vehicleType === 'car_compact' ? 80 : 70;
    const totalDrivingTime = Math.round(totalDistance / (avgSpeed * 1000 / 60));
    const fuelCost = Math.round((totalDistance / 1000) * 2.05 * (vehicleType === 'car_mpv' ? 1.3 : 1)); // RM 2.05/L
    const tollCost = Math.round(distance / 1000 * 0.15 * dayCount); // Rough estimate

    // Generate waypoints
    const waypoints = [];
    const waypointCount = Math.min(dayCount * 3, 8);
    for (let i = 1; i <= waypointCount; i++) {
      const progress = i / (waypointCount + 1);
      waypoints.push({
        name: `Stop ${i}`,
        lat: originLat + (destLat - originLat) * progress + (Math.random() - 0.5) * 0.05,
        lng: originLng + (destLng - originLng) * progress + (Math.random() - 0.5) * 0.05,
        order: i,
        arrivalTime: `${String(8 + i * 2).padStart(2, '0')}:00`,
        duration: `${30 + Math.floor(Math.random() * 60)}min`,
      });
    }

    return NextResponse.json({
      data: {
        totalDistance,
        totalDrivingTime,
        fuelCost,
        tollCost,
        waypoints,
        routeType: style,
        estimatedTotalCost: fuelCost + tollCost,
      },
    });
  } catch (err: any) {
    console.error('Roadtrip calculate error:', err);
    return NextResponse.json({ error: 'Failed to calculate roadtrip' }, { status: 500 });
  }
}

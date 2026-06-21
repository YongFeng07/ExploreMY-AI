import { NextResponse, type NextRequest } from 'next/server';

interface DirectionsStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string | null;
}

interface DirectionsResult {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  mode: 'DRIVING' | 'WALKING';
  distance: number;
  duration: number;
  durationInTraffic: number | null;
  polyline: string;
  steps: DirectionsStep[];
  warnings: string[];
  fares: null | { currency: string; text: string };
}

function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function generateSimulatedRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
  mode: 'DRIVING' | 'WALKING',
): DirectionsResult {
  const directDist = haversineDistance(originLat, originLng, destLat, destLng);
  // Driving follows roads (1.4x multiplier), walking uses shorter paths (1.15x)
  const roadFactor = mode === 'DRIVING' ? 1.4 : 1.15;
  const speedMs = mode === 'DRIVING' ? 8.33 : 1.4; // m/s (30km/h drive, 5km/h walk)
  const distance = Math.round(directDist * roadFactor);
  const duration = Math.round(distance / speedMs);
  const trafficFactor = mode === 'DRIVING' ? 1.0 + Math.random() * 0.6 : 0;

  // Generate waypoints along the route for polyline
  const numPoints = Math.max(4, Math.floor(distance / 200));
  const polylinePoints: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = originLat + (destLat - originLat) * t + (Math.sin(t * Math.PI * 3) * 0.002);
    const lng = originLng + (destLng - originLng) * t + (Math.cos(t * Math.PI * 2.5) * 0.002);
    polylinePoints.push({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
  }

  // Encode as simplified polyline
  const polyline = polylinePoints.map((p, i) => {
    if (i === 0) return `${p.lat},${p.lng}`;
    const prev = polylinePoints[i - 1]!;
    return `${(p.lat - prev.lat).toFixed(6)},${(p.lng - prev.lng).toFixed(6)}`;
  }).join('|');

  // Generate turn-by-turn steps
  const roadNames = ['Jalan Ampang', 'Jalan Tun Razak', 'Jalan Sultan Ismail', 'Jalan Bukit Bintang', 'Jalan Raja Chulan', 'Jalan P. Ramlee', 'Jalan Kia Peng', 'Jalan Yap Kwan Seng'];
  const maneuvers = mode === 'DRIVING'
    ? ['turn-right', 'turn-left', 'turn-slight-right', 'turn-slight-left', 'merge', 'straight', 'turn-right', 'turn-left']
    : ['turn-right', 'turn-left', 'straight', 'turn-right', 'straight', 'turn-left', 'straight'];
  const steps: DirectionsStep[] = [];
  let remainingDist = distance;
  let remainingDur = duration;

  // Start step
  steps.push({
    instruction: mode === 'DRIVING' ? `Head ${Math.random() > 0.5 ? 'southeast' : 'southwest'} on current road` : `Walk ${Math.random() > 0.5 ? 'southeast' : 'southwest'} from starting point`,
    distance: Math.round(distance * 0.08), duration: Math.round(duration * 0.06),
    maneuver: null,
  });

  // Middle steps
  const numSteps = mode === 'DRIVING' ? 4 : 5;
  for (let i = 0; i < numSteps; i++) {
    const stepDist = Math.round(remainingDist / (numSteps - i + 1));
    const stepDur = Math.round(stepDist / speedMs);
    const road = roadNames[i % roadNames.length]!;
    const maneuver = maneuvers[i % maneuvers.length]!;

    const maneuverLabels: Record<string, string> = {
      'turn-right': `Turn right onto ${road}`,
      'turn-left': `Turn left onto ${road}`,
      'turn-slight-right': `Slight right onto ${road}`,
      'turn-slight-left': `Slight left onto ${road}`,
      'merge': `Merge onto ${road}`,
      'straight': `Continue straight on ${road}`,
    };

    steps.push({
      instruction: maneuverLabels[maneuver] ?? `Continue on ${road}`,
      distance: stepDist,
      duration: stepDur,
      maneuver,
    });
    remainingDist -= stepDist;
    remainingDur -= stepDur;
  }

  // Final step
  steps.push({
    instruction: mode === 'DRIVING' ? 'Destination will be on the right' : 'Arrive at destination',
    distance: Math.round(remainingDist),
    duration: Math.round(remainingDur),
    maneuver: null,
  });

  return {
    origin: { lat: originLat, lng: originLng, address: 'Current location' },
    destination: { lat: destLat, lng: destLng, address: 'Destination' },
    mode,
    distance,
    duration,
    durationInTraffic: mode === 'DRIVING' ? Math.round(duration * trafficFactor) : null,
    polyline,
    steps: steps.filter((s) => s.distance > 0),
    warnings: [],
    fares: null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const originLat = parseFloat(searchParams.get('originLat') ?? '0');
  const originLng = parseFloat(searchParams.get('originLng') ?? '0');
  const destLat = parseFloat(searchParams.get('destLat') ?? '0');
  const destLng = parseFloat(searchParams.get('destLng') ?? '0');
  const mode = (searchParams.get('mode') ?? 'DRIVING') as 'DRIVING' | 'WALKING';

  if (!originLat || !originLng || !destLat || !destLng) {
    return NextResponse.json({ error: 'originLat, originLng, destLat, destLng are required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Try Google Directions API
  if (apiKey) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.set('origin', `${originLat},${originLng}`);
      url.searchParams.set('destination', `${destLat},${destLng}`);
      url.searchParams.set('mode', mode.toLowerCase());
      url.searchParams.set('alternatives', 'false');
      url.searchParams.set('departure_time', 'now');
      if (mode === 'DRIVING') url.searchParams.set('traffic_model', 'best_guess');
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.status === 'OK' && data.routes?.[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];

        const result: DirectionsResult = {
          origin: { lat: originLat, lng: originLng, address: leg.start_address },
          destination: { lat: destLat, lng: destLng, address: leg.end_address },
          mode,
          distance: leg.distance.value,
          duration: leg.duration.value,
          durationInTraffic: leg.duration_in_traffic?.value ?? null,
          polyline: route.overview_polyline.points,
          steps: leg.steps.map((s: Record<string, unknown>) => ({
            instruction: (s.html_instructions as string)?.replace(/<[^>]+>/g, '') ?? '',
            distance: (s.distance as { value: number }).value,
            duration: (s.duration as { value: number }).value,
            maneuver: (s.maneuver as string) ?? null,
          })),
          warnings: (data as { warnings?: string[] }).warnings ?? [],
          fares: leg.fare ? { currency: 'MYR', text: leg.fare.text } : null,
        };

        return NextResponse.json(
          { data: result },
          { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' } },
        );
      }
    } catch (err) {
      console.error('Google Directions API error:', err);
    }
  }

  // Fallback: simulated route
  const result = generateSimulatedRoute(originLat, originLng, destLat, destLng, mode);

  return NextResponse.json(
    { data: result },
    { headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=300' } },
  );
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

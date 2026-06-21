import { Injectable } from '@nestjs/common';

const API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? '';

@Injectable()
export class RoutesService {
  async getDirections(originLat: number, originLng: number, destLat: number, destLng: number, mode: string) {
    if (API_KEY) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.set('origin', `${originLat},${originLng}`);
        url.searchParams.set('destination', `${destLat},${destLng}`);
        url.searchParams.set('mode', mode.toLowerCase());
        url.searchParams.set('key', API_KEY);
        if (mode === 'DRIVING') { url.searchParams.set('departure_time', 'now'); url.searchParams.set('traffic_model', 'best_guess'); }

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.status === 'OK' && data.routes?.[0]) {
          const route = data.routes[0];
          const leg = route.legs[0];
          return {
            origin: { lat: originLat, lng: originLng, address: leg.start_address },
            destination: { lat: destLat, lng: destLng, address: leg.end_address },
            mode, distance: leg.distance.value, duration: leg.duration.value,
            durationInTraffic: leg.duration_in_traffic?.value ?? null,
            polyline: route.overview_polyline.points,
            steps: (leg.steps ?? []).map((s: any) => ({
              instruction: (s.html_instructions ?? '').replace(/<[^>]+>/g, ''),
              distance: s.distance?.value ?? 0, duration: s.duration?.value ?? 0,
              maneuver: s.maneuver ?? null,
            })),
            warnings: data.warnings ?? [],
          };
        }
      } catch (e) {
        console.error('Google Directions API error:', e);
      }
    }

    // Fallback: straight-line estimate
    const dist = this.haversine(originLat, originLng, destLat, destLng);
    const roadFactor = mode === 'WALKING' ? 1.15 : 1.4;
    const speed = mode === 'WALKING' ? 1.4 : 8.33;
    const distance = Math.round(dist * roadFactor);
    const duration = Math.round(distance / speed);
    return {
      origin: { lat: originLat, lng: originLng, address: 'Current location' },
      destination: { lat: destLat, lng: destLng, address: 'Destination' },
      mode, distance, duration, durationInTraffic: mode === 'DRIVING' ? Math.round(duration * 1.3) : null,
      polyline: `${originLat},${originLng}|${(destLat - originLat).toFixed(6)},${(destLng - originLng).toFixed(6)}`,
      steps: [
        { instruction: `Head toward destination`, distance: Math.round(distance * 0.5), duration: Math.round(duration * 0.5), maneuver: null },
        { instruction: 'Arrive at destination', distance: Math.round(distance * 0.5), duration: Math.round(duration * 0.5), maneuver: null },
      ],
      warnings: ['Approximate route — road distances may vary.'],
    };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6_371_000; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

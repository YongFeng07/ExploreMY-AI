import { Injectable } from '@nestjs/common';
import { AIWeekendPlanOutput } from '../interfaces/weekend-plan.interface';

interface LatLng { lat: number; lng: number; }

interface RouteSegment {
  from: LatLng;
  to: LatLng;
  mode: string;
  distanceMeters: number;
  durationMinutes: number;
  estimatedCost: number;
}

interface OptimizedDay {
  dayNumber: number;
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
}

@Injectable()
export class RouteOptimizerService {
  // Average speeds in km/h
  private readonly SPEEDS: Record<string, number> = {
    WALKING: 5,
    BICYCLE: 15,
    DRIVING: 35,
    MOTORCYCLE: 30,
    GRAB: 30,
    BUS: 20,
    KTM: 45,
    ETS: 90,
  };

  // Road factor: straight-line × this = approximate road distance
  private readonly ROAD_FACTOR = 1.35;

  // Haversine distance in meters
  private haversine(a: LatLng, b: LatLng): number {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  /**
   * Optimize stop order for each day using nearest-neighbor greedy + 2-opt.
   * Returns optimized route segments.
   */
  optimizeFullPlan(
    days: AIWeekendPlanOutput['days'],
    origins: LatLng[],  // One origin per day (hotel or start point)
    transportMode: string,
  ): OptimizedDay[] {
    return days.map((day, i) => {
      const origin = origins[i] ?? origins[0]!;
      const optimizedOrder = this.optimizeStopOrder(
        day.stops.map(s => ({
          name: s.placeName,
          lat: 0, lng: 0, // Placeholder — in production, use DB coordinates
          transportMode,
        })),
        origin,
        transportMode,
      );
      return {
        dayNumber: day.dayNumber,
        segments: optimizedOrder.segments,
        totalDistance: optimizedOrder.totalDistance,
        totalDuration: optimizedOrder.totalDuration,
      };
    });
  }

  /**
   * Nearest-neighbor + 2-opt TSP solver for a single day's stops.
   */
  private optimizeStopOrder(
    stops: { name: string; lat: number; lng: number; transportMode: string }[],
    origin: LatLng,
    defaultMode: string,
  ): { segments: RouteSegment[]; totalDistance: number; totalDuration: number } {
    if (stops.length === 0) {
      return { segments: [], totalDistance: 0, totalDuration: 0 };
    }

    // Build distance matrix
    const points = [origin, ...stops.map(s => ({ lat: s.lat, lng: s.lng }))];
    const n = points.length;

    // Greedy nearest-neighbor starting from origin (index 0)
    const visited = new Set<number>([0]);
    const order: number[] = [0];

    while (visited.size < n) {
      let bestIdx = -1;
      let bestDist = Infinity;
      const current = order[order.length - 1]!;

      for (let j = 1; j < n; j++) {
        if (visited.has(j)) continue;
        const dist = this.haversine(points[current]!, points[j]!);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = j;
        }
      }

      if (bestIdx >= 0) {
        visited.add(bestIdx);
        order.push(bestIdx);
      }
    }

    // 2-opt local improvement
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 100) {
      improved = false;
      iterations++;
      for (let i = 1; i < order.length - 1; i++) {
        for (let j = i + 2; j < order.length; j++) {
          const oldDist =
            this.haversine(points[order[i - 1]!]!, points[order[i]!]!) +
            this.haversine(points[order[j - 1]!]!, points[order[j]!]!);
          const newDist =
            this.haversine(points[order[i - 1]!]!, points[order[j - 1]!]!) +
            this.haversine(points[order[i]!]!, points[order[j]!]!);
          if (newDist < oldDist) {
            // Reverse segment i..j-1
            const segment = order.slice(i, j).reverse();
            order.splice(i, j - i, ...segment);
            improved = true;
          }
        }
      }
    }

    // Build segments from the optimized order
    const segments: RouteSegment[] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 1; i < order.length; i++) {
      const from = points[order[i - 1]!]!;
      const to = points[order[i]!]!;
      const straightDist = this.haversine(from, to);
      const roadDist = straightDist * this.ROAD_FACTOR;

      // Determine best transport mode for this segment
      const mode = roadDist < 1500 ? 'WALKING' : defaultMode;
      const speed = this.SPEEDS[mode] ?? 30;
      const durationMin = (roadDist / 1000 / speed) * 60;

      // Cost estimate
      let cost = 0;
      if (mode === 'GRAB') {
        cost = 5 + (roadDist / 1000) * 2.5; // Base RM5 + RM2.5/km
      } else if (mode === 'DRIVING') {
        cost = (roadDist / 1000) * 0.25; // ~RM 0.25/km for fuel
      }

      segments.push({
        from,
        to,
        mode,
        distanceMeters: Math.round(roadDist),
        durationMinutes: Math.round(durationMin),
        estimatedCost: Math.round(cost * 100) / 100,
      });

      totalDistance += roadDist;
      totalDuration += durationMin;
    }

    return {
      segments,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
    };
  }
}

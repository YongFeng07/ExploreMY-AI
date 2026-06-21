'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { Car, Footprints, X, Navigation, Clock, Route, Loader2, AlertTriangle, ChevronRight, ArrowRight, ArrowUpRight, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatDistance, formatDuration } from '@/lib/utils';

interface DirectionsStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string | null;
}

interface RouteData {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  mode: 'DRIVING' | 'WALKING';
  distance: number;
  duration: number;
  durationInTraffic: number | null;
  polyline: string;
  steps: DirectionsStep[];
  warnings: string[];
}

interface RouteDisplayProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  destName: string;
  onClose: () => void;
}

const MANEUVER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'turn-right': CornerDownRight,
  'turn-left': CornerDownRight,
  'turn-slight-right': ArrowUpRight,
  'turn-slight-left': ArrowUpRight,
  'uturn-right': CornerDownRight,
  'uturn-left': CornerDownRight,
  'straight': ArrowRight,
  'merge': Navigation,
  'roundabout-right': CornerDownRight,
  'roundabout-left': CornerDownRight,
};

export function RouteDisplay({ originLat, originLng, destLat, destLng, destName, onClose }: RouteDisplayProps) {
  const map = useMap();
  const [mode, setMode] = useState<'DRIVING' | 'WALKING'>('DRIVING');
  const [route, setRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polylinePath, setPolylinePath] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // ── Fetch route ──────────────────────────────────────────────────────────

  const fetchRoute = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `/api/routes/directions?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}&mode=${mode}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRoute(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load route');
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [originLat, originLng, destLat, destLng, mode]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  // ── Render polyline on map ───────────────────────────────────────────────

  useEffect(() => {
    if (!map || !route) return;

    // Clear previous
    polylinePath?.setMap(null);
    markers.forEach((m) => m.setMap(null));

    // Decode polyline
    const points = decodePolyline(route.polyline);
    if (points.length === 0) return;

    const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));

    // Draw polyline
    const poly = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 6,
      zIndex: 5,
    });
    poly.setMap(map);
    setPolylinePath(poly);

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    bounds.extend({ lat: originLat, lng: originLng });
    bounds.extend({ lat: destLat, lng: destLng });
    map.fitBounds(bounds, { top: 80, bottom: 420, left: 40, right: 40 });

    return () => {
      poly.setMap(null);
    };
  }, [map, route, originLat, originLng, destLat, destLng]);

  // ── Mode toggle refetch ─────────────────────────────────────────────────

  const handleModeChange = (newMode: 'DRIVING' | 'WALKING') => {
    setMode(newMode);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  const totalDist = route ? formatDistance(route.distance) : '—';
  const eta = route ? formatDuration(route.duration) : '—';
  const trafficEta = route?.durationInTraffic ? formatDuration(route.durationInTraffic) : null;
  const trafficDelta = route?.durationInTraffic && route.duration
    ? Math.round(((route.durationInTraffic - route.duration) / route.duration) * 100)
    : null;

  return (
    <div className="glass-strong absolute bottom-bottom-nav left-0 right-0 z-20 mx-2 mb-2 overflow-hidden rounded-2xl border shadow-2xl sm:mx-4">
      {/* Handle */}
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/20" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Directions to {destName}</p>
          {route && (
            <p className="text-xs text-muted-foreground">
              {totalDist} · {eta}
              {trafficEta && (
                <span className="ml-1 text-amber-500">· {trafficEta} with traffic</span>
              )}
            </p>
          )}
        </div>
        <button onClick={onClose} className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="mx-4 mb-2 flex rounded-lg bg-muted p-1">
        {(['DRIVING', 'WALKING'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all',
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {m === 'DRIVING' ? <Car className="h-3.5 w-3.5" /> : <Footprints className="h-3.5 w-3.5" />}
            {m === 'DRIVING' ? 'Drive' : 'Walk'}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Calculating route...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center gap-2 py-8">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchRoute}>Retry</Button>
        </div>
      )}

      {/* Route Summary Stats */}
      {route && !loading && (
        <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
          <StatBox icon={Route} label="Distance" value={totalDist} />
          <StatBox
            icon={Clock}
            label={mode === 'DRIVING' && trafficDelta ? `ETA (${trafficDelta > 0 ? `+${trafficDelta}%` : 'normal'})` : 'ETA'}
            value={trafficEta ?? eta}
            highlight={!!trafficDelta && trafficDelta > 10}
          />
          <StatBox
            icon={mode === 'DRIVING' ? Car : Footprints}
            label="Mode"
            value={mode === 'DRIVING' ? 'Driving' : 'Walking'}
          />
        </div>
      )}

      {/* Step-by-step instructions */}
      {route && !loading && (
        <div className="custom-scrollbar max-h-[32vh] overflow-y-auto border-t px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">TURN-BY-TURN</p>
          <div className="relative space-y-0 pl-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
            {route.steps.map((step, i) => {
              const ManeuverIcon = MANEUVER_ICONS[step.maneuver ?? ''] ?? ArrowRight;
              const isFirst = i === 0;
              const isLast = i === route.steps.length - 1;

              return (
                <div key={i} className="relative pb-4">
                  <div className={cn(
                    'absolute -left-[17px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px]',
                    isFirst ? 'border-primary bg-primary text-white' :
                    isLast ? 'border-emerald-500 bg-emerald-500 text-white' :
                    'border-border bg-card text-muted-foreground',
                  )}>
                    {isFirst ? <Navigation className="h-2.5 w-2.5" /> :
                     isLast ? '●' :
                     <ManeuverIcon className="h-2.5 w-2.5" />}
                  </div>
                  <p className="text-sm leading-snug">{step.instruction}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistance(step.distance)} · {formatDuration(step.duration)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom action */}
      {route && !loading && (
        <div className="border-t px-4 py-3">
          <Button
            className="w-full gap-2 rounded-xl"
            onClick={() => window.open(
              `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${mode.toLowerCase()}`,
              '_blank',
            )}
          >
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, highlight }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border p-3 text-center', highlight && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50')}>
      <Icon className={cn('mx-auto h-4 w-4 mb-1', highlight ? 'text-amber-500' : 'text-muted-foreground')} />
      <p className={cn('text-sm font-bold', highlight && 'text-amber-600 dark:text-amber-400')}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Polyline decoder ──────────────────────────────────────────────────────

function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  // Handle our custom format: "lat,lng|dlat,dlng|..."
  if (encoded.includes('|')) {
    const parts = encoded.split('|');
    const points: { lat: number; lng: number }[] = [];
    let lat = 0, lng = 0;
    for (const part of parts) {
      const [dLat, dLng] = part.split(',').map(Number);
      if (points.length === 0) {
        lat = dLat!; lng = dLng!;
      } else {
        lat += dLat!; lng += dLng!;
      }
      points.push({ lat, lng });
    }
    return points;
  }

  // Standard Google encoded polyline
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

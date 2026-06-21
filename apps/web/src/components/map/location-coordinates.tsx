'use client';

import { MapPin, Crosshair, ShieldAlert } from 'lucide-react';
import { useMapStore } from '@/stores/map-store';

export function LocationCoordinates() {
  const { userLocation, locationError, locationPermission, isWatching } = useMapStore();

  if (locationPermission === 'denied' || locationError) {
    return (
      <div className="glass-card mx-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <ShieldAlert className="h-4 w-4 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">Location Access Denied</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Enable location in your browser or device settings to see places near you.
          </p>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="glass-card mx-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Crosshair className="h-4 w-4 animate-pulse text-amber-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">Detecting your location...</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Please allow location access when prompted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card mx-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <MapPin className="h-4 w-4 text-emerald-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {isWatching ? 'Live Location' : 'Location Found'}
        </p>
        <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
          {userLocation.lat.toFixed(6)}°N, {userLocation.lng.toFixed(6)}°E
        </p>
      </div>
      {isWatching && (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-500">Live</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { LocateFixed, ZoomIn, ZoomOut, Map as MapIcon, Satellite } from 'lucide-react';
import { useState } from 'react';
import { useMapStore } from '@/stores/map-store';
import { cn } from '@/lib/utils';

export function MapControls() {
  const map = useMap();
  const userLocation = useMapStore((s) => s.userLocation);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!map) return;
    setIsLocating(true);

    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(16);
      setIsLocating(false);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.panTo(loc);
          map.setZoom(16);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    }
  };

  const handleZoomIn = () => map?.setZoom((map.getZoom() ?? 14) + 1);
  const handleZoomOut = () => map?.setZoom((map.getZoom() ?? 14) - 1);
  const handleToggleLayer = () => {
    if (!map) return;
    const next = !isSatellite;
    map.setMapTypeId(next ? 'satellite' : 'roadmap');
    setIsSatellite(next);
  };

  return (
    <div className="absolute right-3 flex flex-col gap-1.5" style={{ bottom: 'calc(50% + 20px)' }}>
      <button
        onClick={handleLocate}
        disabled={isLocating}
        className="flex h-9 w-9 items-center justify-center rounded-xl glass-card shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        title="My location"
      >
        <LocateFixed
          className={cn('h-4 w-4 transition-colors', isLocating ? 'animate-spin text-primary' : 'text-foreground')}
        />
      </button>
      <button
        onClick={handleZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-xl glass-card shadow-lg transition-all hover:scale-105 active:scale-95"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        onClick={handleZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl glass-card shadow-lg transition-all hover:scale-105 active:scale-95"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <button
        onClick={handleToggleLayer}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95',
          isSatellite ? 'bg-primary text-primary-foreground' : 'glass-card',
        )}
        title={isSatellite ? 'Switch to map' : 'Switch to satellite'}
      >
        {isSatellite ? <Satellite className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

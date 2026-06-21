'use client';

import {
  Map,
  AdvancedMarker,
  type MapCameraChangedEvent,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { useCallback, useRef, type ReactNode } from 'react';
import { useMapStore } from '@/stores/map-store';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const KL_CENTER = { lat: 3.139, lng: 101.6869 };

interface MapContainerProps {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
}

const MALAYSIA_BOUNDS = { north: 7.5, south: 0.8, west: 99.5, east: 119.5 };

export function MapContainer({
  children,
  className,
  interactive = true,
}: MapContainerProps) {
  const { center, zoom, userLocation, setCenter, setZoom } = useMapStore();
  const status = useApiLoadingStatus();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // ALL hooks must be called before any conditional return
  const handleCameraChange = useCallback(
    (ev: MapCameraChangedEvent) => {
      setCenter(ev.detail.center);
      setZoom(ev.detail.zoom);
    },
    [setCenter, setZoom],
  );

  // No API key — show setup instructions
  if (!apiKey) {
    return (
      <div className={cn('relative flex h-full w-full items-center justify-center bg-muted', className)}>
        <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-lg">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="font-semibold text-sm">Google Maps API Key Required</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add <code className="rounded bg-muted px-1 text-[11px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to{' '}
            <code className="rounded bg-muted px-1 text-[11px]">apps/web/.env.local</code>
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (status === APILoadingStatus.LOADING) {
    return (
      <div className={cn('relative flex h-full w-full items-center justify-center bg-muted', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  // Failed
  if (status === APILoadingStatus.FAILED) {
    return (
      <div className={cn('relative flex h-full w-full items-center justify-center bg-muted', className)}>
        <div className="flex max-w-xs flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-lg">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="font-semibold text-sm">Failed to load Google Maps</p>
          <p className="text-xs text-muted-foreground">Check your API key and try again.</p>
        </div>
      </div>
    );
  }

  // Ready — render map
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-muted', className)}>
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'exploremy-map'}
        defaultCenter={center ?? KL_CENTER}
        defaultZoom={zoom ?? 14}
        minZoom={7}
        maxZoom={20}
        onCameraChanged={handleCameraChange}
        gestureHandling={interactive ? 'auto' : 'none'}
        zoomControl={true}
        scrollwheel={true}
        disableDefaultUI
        clickableIcons={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        reuseMaps
        colorScheme="FOLLOW_SYSTEM"
        restriction={{ latLngBounds: MALAYSIA_BOUNDS, strictBounds: false }}
        styles={[
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ]}
      >
        {userLocation && (
          <AdvancedMarker position={userLocation} title="You are here">
            <div className="relative">
              <div className="absolute -left-[11px] -top-[11px] h-[22px] w-[22px] animate-ping rounded-full bg-primary/30" />
              <div className="relative flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg">
                <div className="h-[6px] w-[6px] rounded-full bg-white" />
              </div>
            </div>
          </AdvancedMarker>
        )}
        {children}
      </Map>
    </div>
  );
}

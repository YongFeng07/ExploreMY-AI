'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '@/stores/map-store';

interface GeoOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  interval?: number; // ms between position updates
}

export function useGeolocationWatch(options: GeoOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 30000,
    interval = 5000,
  } = options;

  const watchIdRef = useRef<number | null>(null);
  const {
    setUserLocation,
    setLocationError,
    setLocationPermission,
    setIsWatching,
    isWatching,
  } = useMapStore();

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    // Check permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        result.addEventListener('change', () => {
          setLocationPermission(result.state);
        });
      });
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsWatching(true);
      },
      (error) => {
        setLocationError(getErrorMessage(error));
        setLocationPermission('denied');
      },
      { enableHighAccuracy, timeout, maximumAge },
    );

    // Start watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        setLocationError(getErrorMessage(error));
      },
      { enableHighAccuracy, timeout: interval + 5000, maximumAge: interval },
    );

    setIsWatching(true);
  }, [enableHighAccuracy, timeout, maximumAge, interval, setUserLocation, setLocationError, setLocationPermission, setIsWatching]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, [setIsWatching]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { startWatching, stopWatching, isWatching };
}

function getErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Enable in Settings > Privacy.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable. Check your device settings.';
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.';
    default:
      return 'Unable to determine your location.';
  }
}

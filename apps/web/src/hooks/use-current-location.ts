'use client';

import { useState, useEffect, useCallback } from 'react';

interface LocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permission: PermissionState | null;
}

export function useCurrentLocation() {
  const [location, setLocation] = useState<LocationState>({
    lat: 3.139, // Default: KL
    lng: 101.6869,
    accuracy: null,
    loading: true,
    error: null,
    permission: null,
  });

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      setLocation((prev) => ({ ...prev, permission: result.state }));
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permission: 'granted',
        });
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
          permission: 'denied',
        }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return { ...location, requestPermission };
}

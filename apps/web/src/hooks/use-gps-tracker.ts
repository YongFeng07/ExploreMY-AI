'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy: number;
}

/** Polarsteps-style GPS auto-tracker. Records location every 30 seconds when active. */
export function useGpsTracker(active: boolean = true) {
  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string>('');
  const watchId = useRef<number | null>(null);

  // Load saved points from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gpsBreadcrumbs');
      if (saved) setPoints(JSON.parse(saved));
    } catch {}
  }, []);

  // Save points to localStorage whenever they change
  useEffect(() => {
    if (points.length > 0) {
      localStorage.setItem('gpsBreadcrumbs', JSON.stringify(points.slice(-500)));
    }
  }, [points]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setIsTracking(true);
    setError('');

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: pos.coords.accuracy,
        };

        setPoints(prev => {
          // Don't add if too close to last point (< 30 meters)
          const last = prev[prev.length - 1];
          if (last) {
            const dist = haversineM(last.lat, last.lng, newPoint.lat, newPoint.lng);
            if (dist < 30) return prev;
          }
          return [...prev.slice(-499), newPoint];
        });
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (active) startTracking();
    return () => stopTracking();
  }, [active]);

  const clearBreadcrumbs = () => {
    setPoints([]);
    localStorage.removeItem('gpsBreadcrumbs');
  };

  // Calculate total distance from points
  const totalDistanceKm = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    return sum + haversineKm(points[i - 1].lat, points[i - 1].lng, p.lat, p.lng);
  }, 0);

  return { points, isTracking, error, totalDistanceKm, startTracking, stopTracking, clearBreadcrumbs };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * 1000;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

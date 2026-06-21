'use client';

import { create } from 'zustand';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapState {
  center: LatLng | null;
  zoom: number;
  userLocation: LatLng | null;
  locationError: string | null;
  locationPermission: PermissionState | null;
  isWatching: boolean;
  selectedPlaceId: string | null;
  activeCategory: string | null;
  bottomSheetOpen: boolean;
  bottomSheetSnap: 'min' | 'mid' | 'max';

  setCenter: (center: LatLng) => void;
  setZoom: (zoom: number) => void;
  setUserLocation: (location: LatLng) => void;
  setLocationError: (error: string | null) => void;
  setLocationPermission: (permission: PermissionState | null) => void;
  setIsWatching: (watching: boolean) => void;
  setSelectedPlaceId: (id: string | null) => void;
  setActiveCategory: (category: string | null) => void;
  setBottomSheetOpen: (open: boolean) => void;
  setBottomSheetSnap: (snap: 'min' | 'mid' | 'max') => void;
  reset: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: { lat: 3.139, lng: 101.6869 }, // KL default
  zoom: 14,
  userLocation: null,
  locationError: null,
  locationPermission: null,
  isWatching: false,
  selectedPlaceId: null,
  activeCategory: null,
  bottomSheetOpen: true,
  bottomSheetSnap: 'min',

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setUserLocation: (userLocation) => set({ userLocation, locationError: null }),
  setLocationError: (locationError) => set({ locationError }),
  setLocationPermission: (locationPermission) => set({ locationPermission }),
  setIsWatching: (isWatching) => set({ isWatching }),
  setSelectedPlaceId: (selectedPlaceId) => set({ selectedPlaceId }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setBottomSheetOpen: (bottomSheetOpen) => set({ bottomSheetOpen }),
  setBottomSheetSnap: (bottomSheetSnap) => set({ bottomSheetSnap }),
  reset: () =>
    set({
      center: { lat: 3.139, lng: 101.6869 },
      zoom: 14,
      selectedPlaceId: null,
      activeCategory: null,
      bottomSheetOpen: true,
      bottomSheetSnap: 'min',
    }),
}));

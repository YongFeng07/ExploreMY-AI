'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: Record<string, number>;
  budgetLevel: number;
  preferredTransport: string[];
}

interface UserState {
  isOnboardingComplete: boolean;
  preferences: UserPreferences;
  recentPlaces: string[]; // last 10 viewed place IDs

  setOnboardingComplete: (complete: boolean) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addRecentPlace: (placeId: string) => void;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  dietaryRestrictions: [],
  cuisinePreferences: {},
  budgetLevel: 2,
  preferredTransport: ['mrt', 'grab', 'walking'],
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      preferences: defaultPreferences,
      recentPlaces: [],

      setOnboardingComplete: (isOnboardingComplete) => set({ isOnboardingComplete }),
      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      addRecentPlace: (placeId) =>
        set((state) => ({
          recentPlaces: [placeId, ...state.recentPlaces.filter((id) => id !== placeId)].slice(0, 10),
        })),
      reset: () =>
        set({
          isOnboardingComplete: false,
          preferences: defaultPreferences,
          recentPlaces: [],
        }),
    }),
    { name: 'exploremy-user' },
  ),
);

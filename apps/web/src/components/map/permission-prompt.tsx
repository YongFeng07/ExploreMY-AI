'use client';

import { MapPin, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionPromptProps {
  onEnable: () => void;
}

export function PermissionPrompt({ onEnable }: PermissionPromptProps) {
  return (
    <div className="glass-strong absolute inset-x-4 bottom-24 z-20 overflow-hidden rounded-2xl border shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2">
      <div className="bg-gradient-to-r from-primary to-tropical-teal px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <LocateFixed className="h-5 w-5" />
          <h2 className="text-base font-semibold">Enable Location</h2>
        </div>
        <p className="mt-1 text-sm text-white/80">
          Allow location access to discover amazing places near you in real-time.
        </p>
      </div>

      <div className="space-y-3 bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
            <MapPin className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Nearby Discovery</p>
            <p className="text-xs text-muted-foreground">Find food, attractions, and hidden gems around you</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Smart Navigation</p>
            <p className="text-xs text-muted-foreground">Get directions optimized for Malaysian roads and transit</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">AI Recommendations</p>
            <p className="text-xs text-muted-foreground">Personalized suggestions based on where you are</p>
          </div>
        </div>

        <Button onClick={onEnable} size="lg" className="mt-1 w-full rounded-xl gap-2">
          <LocateFixed className="h-4 w-4" />
          Share My Location
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Your location stays private. You control sharing anytime.
        </p>
      </div>
    </div>
  );
}

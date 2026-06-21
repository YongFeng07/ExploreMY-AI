'use client';

import { cn } from '../lib/utils';
import { Button } from './button';
import { MapPin, Compass, Navigation, Shield } from 'lucide-react';

interface PermissionPromptProps {
  onEnable: () => void;
  onSkip: () => void;
  className?: string;
}

export function PermissionPrompt({
  onEnable,
  onSkip,
  className,
}: PermissionPromptProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center min-h-[300px]',
        className,
      )}
    >
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20 flex items-center justify-center">
          <MapPin className="h-10 w-10 text-orange-500" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center ring-2 ring-white dark:ring-gray-950">
          <Navigation className="h-4 w-4 text-blue-500" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Enable Location
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-8">
        Discover nearby attractions, get smart navigation, and personalized
        AI recommendations based on where you are.
      </p>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm">
        {[
          { icon: MapPin, label: 'Nearby Discovery' },
          { icon: Navigation, label: 'Smart Navigation' },
          { icon: Compass, label: 'AI Recommendations' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon className="h-5 w-5 text-orange-500" />
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex flex-col w-full max-w-xs gap-2">
        <Button onClick={onEnable} size="lg" className="w-full">
          <Navigation className="mr-2 h-4 w-4" />
          Share My Location
        </Button>
        <Button onClick={onSkip} variant="ghost" size="sm" className="w-full">
          Not now
        </Button>
      </div>

      <p className="flex items-center gap-1 mt-4 text-[11px] text-gray-400 dark:text-gray-500">
        <Shield className="h-3 w-3" />
        Your location stays private. You control sharing anytime.
      </p>
    </div>
  );
}

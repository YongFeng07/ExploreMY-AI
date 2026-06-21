'use client';

import { cn } from '../lib/utils';
import { Loader2, Route, Clock, DollarSign, MapPin } from 'lucide-react';

interface RouteLeg {
  mode: string;
  icon: string;
  durationMin: number;
  distanceKm: number;
  costEstimate?: number;
  instructions?: string;
}

interface RouteInfo {
  totalDuration: number;
  totalDistance: number;
  totalCost: number;
  currency: string;
  legs: RouteLeg[];
}

interface RouteDisplayProps {
  route: RouteInfo | null;
  loading?: boolean;
  error?: string;
  className?: string;
}

export function RouteDisplay({
  route,
  loading = false,
  error,
  className,
}: RouteDisplayProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-3 p-8',
          className,
        )}
        role="status"
      >
        <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Finding best routes...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          'p-6 text-center',
          className,
        )}
        role="alert"
      >
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!route || !route.legs.length) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-8 text-center',
          className,
        )}
        role="status"
      >
        <Route className="h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Route information not available
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4 text-orange-500" />
          {Math.floor(route.totalDuration / 60)}h {route.totalDuration % 60}m
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Route className="h-4 w-4 text-orange-500" />
          {route.totalDistance.toFixed(1)} km
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <DollarSign className="h-4 w-4 text-green-500" />
          {route.currency} {route.totalCost.toFixed(2)}
        </span>
      </div>

      {/* Legs */}
      {route.legs.map((leg, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <span className="text-xl">{leg.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {leg.mode}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {leg.durationMin} min • {leg.distanceKm.toFixed(1)} km
              {leg.costEstimate !== undefined && ` • ~RM ${leg.costEstimate}`}
            </p>
            {leg.instructions && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {leg.instructions}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

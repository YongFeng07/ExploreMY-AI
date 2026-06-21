'use client';

import { cn } from '../lib/utils';
import { ReactNode } from 'react';

interface MapContainerProps {
  children?: ReactNode;
  className?: string;
  height?: string;
  loading?: boolean;
}

/**
 * Map container wrapper with loading state.
 * The actual Google Maps rendering is handled by the @vis.gl/react-google-maps library.
 */
export function MapContainer({
  children,
  className,
  height = 'h-[50vh] md:h-[70vh]',
  loading = false,
}: MapContainerProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900',
        height,
        className,
      )}
      role="region"
      aria-label="Map view"
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Loading map...
            </span>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

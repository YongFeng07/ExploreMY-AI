import { cn } from '../lib/utils';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

interface LocationCoordinatesProps {
  lat: number;
  lng: number;
  accuracy?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function LocationCoordinates({
  lat,
  lng,
  accuracy,
  label,
  compact = false,
  className,
}: LocationCoordinatesProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        compact ? 'text-xs' : 'text-sm',
        className,
      )}
      aria-label={`Location: ${label || `${lat}, ${lng}`}`}
    >
      <div className={cn(
        'flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500',
        compact ? 'h-6 w-6' : 'h-8 w-8',
      )}>
        <Crosshair className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
      </div>
      <div className="min-w-0">
        {label && (
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {label}
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-400 tabular-nums">
          {lat.toFixed(6)}, {lng.toFixed(6)}
          {accuracy !== undefined && ` (±${accuracy.toFixed(0)}m)`}
        </p>
      </div>
    </div>
  );
}

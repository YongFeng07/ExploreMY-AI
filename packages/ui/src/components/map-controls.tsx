import { cn } from '../lib/utils';
import { Plus, Minus, Locate, Layers } from 'lucide-react';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onToggleLayer?: () => void;
  isSatellite?: boolean;
  className?: string;
}

export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  onToggleLayer,
  isSatellite = false,
  className,
}: MapControlsProps) {
  return (
    <div
      className={cn(
        'absolute right-3 top-20 md:top-24 flex flex-col gap-1.5',
        className,
      )}
      role="toolbar"
      aria-label="Map controls"
    >
      <button
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-950 shadow-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        aria-label="Zoom in"
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-950 shadow-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        aria-label="Zoom out"
        type="button"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="h-px bg-gray-200 dark:bg-gray-800 mx-1.5" />
      <button
        onClick={onLocate}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-gray-950 shadow-lg border border-gray-200 dark:border-gray-800 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        aria-label="Find my location"
        type="button"
      >
        <Locate className="h-4 w-4" />
      </button>
      <button
        onClick={onToggleLayer}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl shadow-lg border transition-colors',
          isSatellite
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900',
        )}
        aria-label={isSatellite ? 'Switch to map view' : 'Switch to satellite view'}
        aria-pressed={isSatellite}
        type="button"
      >
        <Layers className="h-4 w-4" />
      </button>
    </div>
  );
}

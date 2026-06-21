import { cn } from '../lib/utils';
import { Calendar, MapPin, Users, DollarSign, CheckCircle2 } from 'lucide-react';
import { Badge } from './badge';

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  days: number;
  budget?: number;
  currency?: string;
  startDate?: string;
  collaborators?: number;
  coverPhoto?: string;
  isPublic?: boolean;
  isCompleted?: boolean;
  onClick?: (id: string) => void;
  className?: string;
}

export function TripCard({
  id,
  title,
  destination,
  days,
  budget,
  currency = 'MYR',
  startDate,
  collaborators,
  coverPhoto,
  isPublic,
  isCompleted,
  onClick,
  className,
}: TripCardProps) {
  return (
    <button
      className={cn(
        'flex flex-col w-full rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all text-left active:scale-[0.99]',
        className,
      )}
      onClick={() => onClick?.(id)}
      type="button"
    >
      {/* Cover Image */}
      <div className="relative h-40 w-full bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🗺️
          </div>
        )}
        {isCompleted && (
          <Badge variant="success" className="absolute top-3 left-3 gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        )}
        {isPublic && (
          <Badge variant="secondary" className="absolute top-3 right-3">
            Public
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-orange-500" />
            {destination}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            {days} day{days > 1 ? 's' : ''}
          </span>
          {budget && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-orange-500" />
              {currency} {budget.toLocaleString()}
            </span>
          )}
          {collaborators !== undefined && collaborators > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-orange-500" />
              {collaborators}
            </span>
          )}
        </div>
        {startDate && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">
            {new Date(startDate).toLocaleDateString('en-MY', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </button>
  );
}

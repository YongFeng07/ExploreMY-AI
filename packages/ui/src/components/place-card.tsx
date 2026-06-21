import { cn } from '../lib/utils';
import { Star, MapPin, Clock, Heart } from 'lucide-react';
import { Badge } from './badge';
import { useState } from 'react';

interface PlaceCardProps {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount?: number;
  distance?: number;
  address?: string;
  city?: string;
  photo?: string;
  isOpen?: boolean;
  isHiddenGem?: boolean;
  isTrending?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

export function PlaceCard({
  id,
  name,
  category,
  rating,
  reviewCount,
  distance,
  address,
  city,
  photo,
  isOpen,
  isHiddenGem,
  isTrending,
  isFavorite = false,
  onToggleFavorite,
  onClick,
  className,
}: PlaceCardProps) {
  const [heartAnimate, setHeartAnimate] = useState(false);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartAnimate(true);
    setTimeout(() => setHeartAnimate(false), 300);
    onToggleFavorite?.(id);
  };

  return (
    <button
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all text-left active:scale-[0.99]',
        className,
      )}
      onClick={() => onClick?.(id)}
      type="button"
    >
      {/* Photo */}
      <div className="relative h-[88px] w-[88px] shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl bg-gradient-to-br from-orange-100 to-rose-100 dark:from-orange-900/20 dark:to-rose-900/20">
            🏛️
          </div>
        )}
        {isTrending && (
          <Badge
            variant="warning"
            className="absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0"
          >
            🔥 Trending
          </Badge>
        )}
        {isHiddenGem && (
          <Badge
            variant="info"
            className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0"
          >
            💎 Gem
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs text-orange-500 font-medium">{category}</span>
          {isOpen !== undefined && (
            <span
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                isOpen
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              )}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate mb-0.5">
          {name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
            {reviewCount && ` (${reviewCount})`}
          </span>
          {distance !== undefined && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`}
            </span>
          )}
        </div>
        {(address || city) && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {address || city}
          </p>
        )}
      </div>

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={handleFavorite}
          className={cn(
            'shrink-0 p-1.5 rounded-full transition-all',
            heartAnimate && 'scale-125',
            isFavorite
              ? 'text-red-500'
              : 'text-gray-300 dark:text-gray-600 hover:text-red-400',
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-all',
              isFavorite && 'fill-current',
              heartAnimate && 'animate-ping',
            )}
          />
        </button>
      )}
    </button>
  );
}

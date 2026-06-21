'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, Navigation, Heart, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDistance, getPriceLevel } from '@/lib/utils';
import { useState, useCallback } from 'react';

const CATEGORY_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️', CAFE: '☕', STREET_FOOD: '🍜', FOOD_COURT: '🍱',
  NIGHT_MARKET: '🌙', ATTRACTION: '🏛️', SHOPPING_MALL: '🛍️', HOTEL: '🏨',
  HOSTEL: '🛏️', RESORT: '🏖️', PHARMACY: '💊', HOSPITAL: '🏥', CLINIC: '🏥',
  PETROL_STATION: '⛽', EV_CHARGER: '🔌', PUBLIC_TOILET: '🚻',
  PARK: '🌳', BEACH: '🏖️', HIKING_TRAIL: '🥾', MUSEUM: '🏛️',
  TEMPLE: '🛕', MOSQUE: '🕌', CHURCH: '⛪', VIEWPOINT: '📸',
  MARKET: '🏪', ENTERTAINMENT: '🎬', OTHER: '📍',
};

export interface PlaceCardData {
  id: string;
  slug: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  priceLevel?: number | null;
  photos?: string[];
  address?: string;
  city?: string;
  isOpen?: boolean;
  isHiddenGem?: boolean;
  isTrending?: boolean;
}

interface PlaceCardProps extends PlaceCardData {
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
  onFavorite?: (id: string) => void;
  isFavorited?: boolean;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+PhzwvdGV4dD48L3N2Zz4=';

export function PlaceCard({
  id,
  slug,
  name,
  category,
  rating,
  reviewCount,
  distance,
  priceLevel,
  photos,
  address,
  isOpen,
  isHiddenGem,
  isTrending,
  variant = 'horizontal',
  className,
  onFavorite,
  isFavorited = false,
}: PlaceCardProps) {
  const photoUrl = photos?.[0] ?? PLACEHOLDER_IMAGE;
  const catIcon = CATEGORY_ICONS[category || 'OTHER'] ?? '📍';

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onFavorite?.(id);
    },
    [id, onFavorite],
  );

  // Compact variant — used in search results and lists
  if (variant === 'compact') {
    return (
      <Link
        href={`/places/${slug}`}
        className={cn(
          'flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-accent',
          className,
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
          {catIcon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
            <span>{(rating ?? 0).toFixed(1)}</span>
            {distance !== undefined && (
              <>
                <span className="opacity-40">·</span>
                <span>{formatDistance(distance)}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </Link>
    );
  }

  // Vertical variant — used for horizontal scrolling carousels
  if (variant === 'vertical') {
    return (
      <Link
        href={`/places/${slug}`}
        className={cn(
          'group block w-40 shrink-0 overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg sm:w-48',
          className,
        )}
      >
        <div className="relative h-28 w-full overflow-hidden sm:h-32">
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="192px"
            unoptimized={photoUrl === PLACEHOLDER_IMAGE}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {isHiddenGem && (
              <Badge variant="success" className="px-1.5 py-0 text-[10px] shadow-sm">
                💎 Gem
              </Badge>
            )}
            {isTrending && (
              <Badge variant="warning" className="px-1.5 py-0 text-[10px] shadow-sm">
                🔥 Hot
              </Badge>
            )}
          </div>
          {onFavorite && (
            <button
              onClick={handleFavorite}
              className="absolute right-2 top-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm transition-all hover:bg-black/50"
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5 text-white',
                  isFavorited && 'fill-red-500 text-red-500',
                )}
              />
            </button>
          )}
        </div>
        <div className="p-2.5">
          <p className="truncate text-sm font-semibold">{name}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
            <span>{(rating ?? 0).toFixed(1)}</span>
            <span className="opacity-60">({reviewCount})</span>
            {priceLevel != null && (
              <>
                <span className="opacity-40">·</span>
                <span>{getPriceLevel(priceLevel)}</span>
              </>
            )}
          </div>
          {isOpen !== undefined && (
            <span
              className={cn(
                'mt-0.5 text-[11px] font-medium',
                isOpen ? 'text-emerald-500' : 'text-red-500',
              )}
            >
              {isOpen ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // Horizontal variant — default (full-width cards)
  return (
    <Link
      href={`/places/${slug}`}
      className={cn(
        'group flex gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-md',
        className,
      )}
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg">
        <Image
          src={photoUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="88px"
          unoptimized={photoUrl === PLACEHOLDER_IMAGE}
        />
        {isHiddenGem && (
          <Badge variant="success" className="absolute left-1 top-1 px-1 py-0 text-[9px]">
            💎
          </Badge>
        )}
        {isTrending && !isHiddenGem && (
          <Badge variant="warning" className="absolute left-1 top-1 px-1 py-0 text-[9px]">
            🔥
          </Badge>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h3 className="truncate text-sm font-semibold leading-tight">{name}</h3>

        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{catIcon}</span>
          <span>{(category || 'Place').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {(rating ?? 0).toFixed(1)}
          </span>
          <span className="opacity-60">({reviewCount})</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {distance !== undefined && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {formatDistance(distance)}
            </span>
          )}
          {priceLevel != null && <span>{getPriceLevel(priceLevel)}</span>}
          {isOpen !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 font-medium',
                isOpen ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              <Clock className="h-3 w-3" />
              {isOpen ? 'Open' : 'Closed'}
            </span>
          )}
        </div>

        {address && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{address}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center justify-between">
        {onFavorite && (
          <button
            onClick={handleFavorite}
            className="rounded-full p-1.5 transition-colors hover:bg-muted"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground',
              )}
            />
          </button>
        )}
        <span className="rounded-full bg-muted p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      </div>
    </Link>
  );
}

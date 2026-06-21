'use client';

import { cn } from '../lib/utils';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const sizeMap = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' };

export function StarRating({
  value = 0,
  max = 5,
  size = 'md',
  readonly = true,
  onChange,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = readonly ? value : hoverValue || value;

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role="radiogroup"
      aria-label={`Rating: ${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;
        const halfFilled = !filled && starValue <= Math.ceil(displayValue) && displayValue % 1 !== 0;

        return (
          <button
            key={i}
            type="button"
            className={cn(
              'transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 rounded-sm',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            )}
            disabled={readonly}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            aria-checked={starValue <= value}
            role="radio"
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            onMouseLeave={() => !readonly && setHoverValue(0)}
            onClick={() => {
              if (!readonly) {
                onChange?.(starValue);
              }
            }}
          >
            <Star
              className={cn(
                sizeMap[size],
                'transition-all',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : halfFilled
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export function StarRating({ value, onChange, size = 'md', readonly }: StarRatingProps) {
  const sizes = { sm: 'h-3 w-3', md: 'h-5 w-5', lg: 'h-8 w-8' };
  const gap = size === 'sm' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={cn('flex', gap)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn('transition-all duration-150', !readonly && 'hover:scale-125 cursor-pointer', readonly && 'cursor-default')}
        >
          <Star
            className={cn(
              sizes[size],
              'transition-colors',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-[#D4C4B0]',
            )}
          />
        </button>
      ))}
    </div>
  );
}

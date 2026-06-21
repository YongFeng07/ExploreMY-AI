'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface CategoryItem {
  value: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryItem[] = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: '🍽️' },
  { value: 'CAFE', label: 'Cafe', icon: '☕' },
  { value: 'STREET_FOOD', label: 'Street Food', icon: '🍜' },
  { value: 'ATTRACTION', label: 'Attraction', icon: '🏛️' },
  { value: 'SHOPPING_MALL', label: 'Shopping', icon: '🛍️' },
  { value: 'HOTEL', label: 'Hotel', icon: '🏨' },
  { value: 'PARK', label: 'Park', icon: '🌳' },
  { value: 'BEACH', label: 'Beach', icon: '🏖️' },
  { value: 'NIGHT_MARKET', label: 'Night Market', icon: '🌙' },
  { value: 'HIKING_TRAIL', label: 'Hiking', icon: '🥾' },
  { value: 'MUSEUM', label: 'Museum', icon: '🏛️' },
  { value: 'TEMPLE', label: 'Temple', icon: '🛕' },
];

interface CategoryPillsProps {
  selected?: string;
  onSelect: (category: string | undefined) => void;
  className?: string;
}

export function CategoryPills({ selected, onSelect, className }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-category="${selected}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  return (
    <div
      ref={scrollRef}
      className={cn('flex gap-2 overflow-x-auto no-scrollbar px-4 py-2', className)}
    >
      <button
        onClick={() => onSelect(undefined)}
        className={cn(
          'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200',
          !selected
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        )}
      >
        All
      </button>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <button
            key={cat.value}
            data-category={cat.value}
            onClick={() => onSelect(isSelected ? undefined : cat.value)}
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground',
            )}
          >
            <span className="text-sm">{cat.icon}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

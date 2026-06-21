import { cn } from '../lib/utils';
import { HTMLAttributes } from 'react';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800',
        className,
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

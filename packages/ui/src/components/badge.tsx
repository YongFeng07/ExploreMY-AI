import { cn } from '../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { HTMLAttributes } from 'react';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        secondary:
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        destructive:
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        success:
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        info:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        outline:
          'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      role="status"
      {...props}
    />
  );
}

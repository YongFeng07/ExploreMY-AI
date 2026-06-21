import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className,
      )}
      role="status"
    >
      {icon && (
        <div className="mb-4 text-gray-300 dark:text-gray-600">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mb-6">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

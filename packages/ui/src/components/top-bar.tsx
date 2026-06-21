import { cn } from '../lib/utils';
import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
  transparent?: boolean;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  backTo,
  onBack,
  rightAction,
  transparent = false,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b',
        transparent
          ? 'border-transparent bg-transparent backdrop-blur-none'
          : 'border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl',
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {(backTo || onBack) && (
          <a
            href={backTo || '#'}
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </a>
        )}
        <div className="min-w-0">
          {title && (
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {rightAction && (
        <div className="flex items-center shrink-0">{rightAction}</div>
      )}
    </header>
  );
}

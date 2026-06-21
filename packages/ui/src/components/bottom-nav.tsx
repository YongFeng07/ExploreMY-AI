import { cn } from '../lib/utils';
import { ReactNode } from 'react';

interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl safe-area-bottom',
        className,
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-[64px] px-2 py-1 rounded-xl transition-colors relative',
              item.active
                ? 'text-orange-500'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400',
            )}
            aria-current={item.active ? 'page' : undefined}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
            {item.badge && (
              <span className="absolute -top-0.5 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}

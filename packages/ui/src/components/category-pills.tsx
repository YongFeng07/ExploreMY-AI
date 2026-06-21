import { cn } from '../lib/utils';

export interface Category {
  id: string;
  label: string;
  icon: string;
}

interface CategoryPillsProps {
  categories: Category[];
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function CategoryPills({
  categories,
  selected,
  onSelect,
  className,
}: CategoryPillsProps) {
  return (
    <div
      className={cn('flex items-center gap-2 overflow-x-auto no-scrollbar px-1 py-2', className)}
      role="tablist"
      aria-label="Categories"
    >
      {categories.map((cat) => {
        const isSelected = cat.id === selected;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect?.(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 border-2',
              isSelected
                ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-700 active:scale-95',
            )}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${cat.label} category`}
            type="button"
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

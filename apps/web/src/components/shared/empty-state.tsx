import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-extrabold text-[#1A1A1A] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B7280] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

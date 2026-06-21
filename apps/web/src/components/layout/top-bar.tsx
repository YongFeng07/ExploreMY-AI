'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps { title?: string; showBack?: boolean; backHref?: string; onBack?: () => void; transparent?: boolean; className?: string; }

export function TopBar({ title, showBack, backHref, onBack, transparent, className }: TopBarProps) {
  const router = useRouter();
  const handleBack = () => { if (onBack) onBack(); else if (backHref) router.push(backHref); else router.back(); };

  return (
    <header className={cn('fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between px-4 pt-safe',
      transparent ? 'bg-transparent' : 'border-b border-[#E5E7EB] bg-[#FAFAF8]/90 backdrop-blur-xl', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack && (
          <button onClick={handleBack} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#F3F4F6] transition-colors">
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
          </button>
        )}
        {title && <h1 className="truncate text-lg font-bold text-[#1A1A1A]">{title}</h1>}
      </div>
    </header>
  );
}

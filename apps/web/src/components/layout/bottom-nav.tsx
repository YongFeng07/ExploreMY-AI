'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Search, Sparkles, Map, User, Wallet, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check Clerk session from the global Clerk object
    const timer = setInterval(() => {
      const w = window as any;
      if (w.Clerk) {
        setIsLoggedIn(!!w.Clerk.user);
        setMounted(true);
        clearInterval(timer);
      }
    }, 200);
    // Timeout after 3 seconds
    const fallback = setTimeout(() => {
      clearInterval(timer);
      setMounted(true);
    }, 3000);
    return () => { clearInterval(timer); clearTimeout(fallback); };
  }, []);

  const lastItem = !mounted
    ? { href: '/profile', label: 'You', icon: User } as const
    : isLoggedIn
      ? { href: '/profile', label: 'You', icon: User } as const
      : { href: '/login', label: 'Sign In', icon: LogIn } as const;

  const NAV = [
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/weekend-planner', label: 'Plan', icon: Sparkles },
    { href: '/date', label: 'Date', icon: Map },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    lastItem,
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn('relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 active:scale-95',
                active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600')}>
              {active && (
                <div className="absolute inset-x-1 -top-px h-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-sm shadow-amber-200"/>
              )}
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-300',
                active && 'bg-amber-50 scale-110')}>
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className={cn('text-[9px] font-semibold leading-none', active && 'font-extrabold')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

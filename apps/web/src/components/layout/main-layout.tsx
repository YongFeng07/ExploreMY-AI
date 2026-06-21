'use client';

import { type ReactNode } from 'react';
import { BottomNav } from './bottom-nav';
import { OnboardingWizard } from '@/components/shared/onboarding-wizard';

interface MainLayoutProps { children: ReactNode; showNav?: boolean; pb?: boolean; }

export function MainLayout({ children, showNav = true, pb = true }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <main className="flex-1 relative z-10">{children}</main>
      {showNav && <BottomNav />}
      {pb && !showNav && <div className="h-bottom-nav" />}
      <OnboardingWizard />
    </div>
  );
}

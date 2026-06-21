'use client';

import { Toaster } from 'sonner';
import { useTheme } from 'next-themes';

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={4000}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        classNames: {
          toast: 'glass-card',
          title: 'text-sm font-medium',
          description: 'text-xs text-muted-foreground',
        },
      }}
    />
  );
}

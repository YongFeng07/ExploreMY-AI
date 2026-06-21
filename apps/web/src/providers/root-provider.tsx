'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';
import { MapProvider } from './map-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';

interface RootProviderProps {
  children: ReactNode;
}

export function RootProvider({ children }: RootProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <QueryProvider>
          <MapProvider>
            <ToastProvider />
            {children}
          </MapProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

'use client';

import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

/**
 * Authentication provider for ExploreMY AI.
 * Wraps the app with Clerk for secure, managed authentication.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#F59E0B',
          colorText: '#0E0E0E',
          colorBackground: '#FFFFFF',
          colorInputBackground: '#FFFFFF',
          colorInputText: '#0E0E0E',
          colorInputBorder: '#E5E7EB',
        },
        elements: {
          formButtonPrimary:
            'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-200',
          card: 'shadow-xl border-0 rounded-2xl',
          headerTitle: 'text-gray-900 font-extrabold',
          headerSubtitle: 'text-gray-500',
          socialButtonsBlockButton:
            'border-2 border-gray-200 rounded-xl hover:bg-gray-50',
          formFieldInput:
            'rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-50',
          footerActionLink: 'text-amber-600 font-bold hover:underline',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

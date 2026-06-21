'use client';

import type { ReactNode } from 'react';

/**
 * Authentication provider for ExploreMY AI.
 *
 * Previously used Clerk, which has been removed in favor of the custom JWT-based
 * auth system. The auth state is managed by the auth-store (Zustand-like global state).
 *
 * This provider is kept as a simple passthrough for future re-integration of
 * a third-party auth provider if needed.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

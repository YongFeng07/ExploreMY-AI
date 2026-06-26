'use client';

import { useCallback, useMemo } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/nextjs';

const API = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string;
  location: string;
  level: number;
  xp: number;
  memberSince: string;
  role: string;
  isVerified: boolean;
}

/**
 * Map Clerk user to ExploreMY User shape.
 */
function mapClerkUser(clerkUser: any): User | null {
  if (!clerkUser) return null;
  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
  return {
    id: clerkUser.id,
    email: primaryEmail,
    displayName:
      clerkUser.fullName ||
      clerkUser.username ||
      primaryEmail.split('@')[0] ||
      'Explorer',
    avatarUrl: clerkUser.imageUrl || null,
    coverUrl: null,
    bio: '',
    location: '',
    level: 1,
    xp: 0,
    memberSince: new Date(clerkUser.createdAt).toISOString(),
    role: 'user',
    isVerified:
      clerkUser.primaryEmailAddress?.verification?.status === 'verified',
  };
}

/**
 * Read current auth state without React hook — for use in non-component code.
 */
export function getAuthState() {
  if (typeof window === 'undefined') {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: Boolean(window.localStorage.getItem('__clerk_client_jwt')),
    isLoading: false,
  };
}

/**
 * Production-grade authenticated fetch.
 * Uses Clerk session token via the global Clerk instance.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  let token = '';

  if (typeof window !== 'undefined' && (window as any).Clerk?.session) {
    try {
      token = await (window as any).Clerk.session.getToken();
    } catch { /* noop */ }
  }

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/login';
  }

  return res;
}

/**
 * Fetch with auto token refresh. Clerk handles token refresh automatically.
 */
export async function apiFetchSafe(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return apiFetch(url, options);
}

/**
 * Get auth headers synchronously. Uses cached Clerk token from localStorage.
 */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const clerkToken = localStorage.getItem('__clerk_db_jwt');
    if (clerkToken) {
      const parsed = JSON.parse(clerkToken);
      const token = parsed?.__session || '';
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch { /* noop */ }
  return {};
}

/**
 * React hook — wraps Clerk hooks into the existing ExploreMY Auth API.
 * Maintains backward compatibility with all components using `useAuth()`.
 */
export function useAuth() {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  const user = useMemo(() => mapClerkUser(clerkUser), [clerkUser?.id, clerkUser?.fullName, clerkUser?.imageUrl, clerkUser?.primaryEmailAddress?.emailAddress]);
  const isAuthenticated = isSignedIn ?? false;
  const isLoading = !isLoaded;

  // legacy login — redirect to Clerk SignIn page
  const login = useCallback(async (_email: string, _password: string) => {
    window.location.href = '/login';
  }, []);

  // legacy register — redirect to Clerk SignUp page
  const register = useCallback(
    async (_email: string, _password: string, _displayName: string) => {
      window.location.href = '/register';
    },
    [],
  );

  const logout = useCallback(async () => {
    await signOut();
    window.location.href = '/';
  }, [signOut]);

  const forgotPassword = useCallback(async (email: string) => {
    window.location.href = `/forgot-password?email=${encodeURIComponent(email)}`;
    return { message: 'Check your email for a reset link.' };
  }, []);

  const resetPassword = useCallback(
    async (_token: string, _newPassword: string) => {
      window.location.href = '/reset-password';
      return { message: 'Password reset.' };
    },
    [],
  );

  const verifyEmail = useCallback(async (_token: string) => {
    window.location.href = '/verify-email';
    return { message: 'Email verified.' };
  }, []);

  const resendVerification = useCallback(async (_email: string) => {
    return { message: 'Verification email sent.' };
  }, []);

  const refreshSession = useCallback(async () => {
    // Clerk handles session refresh automatically
  }, []);

  const silentRefresh = useCallback(async (): Promise<string | null> => {
    if ((window as any).Clerk?.session) {
      try {
        return await (window as any).Clerk.session.getToken();
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  return {
    user,
    accessToken: null,
    refreshToken: null,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshSession,
    silentRefresh,
  };
}

'use client';

import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

let globalState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

/** Read current auth state without React hook — for use in non-component code */
export function getAuthState(): AuthState {
  return { ...globalState };
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function getStoredTokens() {
  if (typeof window === 'undefined')
    return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function storeUser(user: any) {
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userName', user.displayName);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
}

/**
 * Production-grade authenticated fetch.
 * Automatically injects Bearer token and handles 401 responses
 * by clearing auth state and redirecting to login.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : '';
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (
    !headers['Content-Type'] &&
    !(options.body instanceof FormData)
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    globalState = {
      ...globalState,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    };
    notify();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return res;
}

export function useAuth() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // AUTH METHODS
  // ═══════════════════════════════════════════════════════════════════

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Invalid email or password');
    }

    storeTokens(data.accessToken, data.refreshToken);
    storeUser(data.user);
    globalState = {
      ...globalState,
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
    };
    notify();
    return data.user;
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store tokens but user is not verified yet
      storeTokens(data.accessToken, data.refreshToken);
      storeUser(data.user);
      globalState = {
        ...globalState,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
      };
      notify();
      return data;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${globalState.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: globalState.refreshToken }),
      });
    } catch {
      // Logout locally even if server call fails
    }
    clearTokens();
    globalState = {
      ...globalState,
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
    notify();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      return data;
    },
    [],
  );

  const verifyEmail = useCallback(async (token: string) => {
    const res = await fetch(`${API}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Email verification failed');
    }
    return data;
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    const res = await fetch(`${API}/api/v1/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
  }, []);

  const refreshSession = useCallback(async () => {
    const stored = getStoredTokens();
    if (!stored.accessToken) {
      globalState = { ...globalState, isLoading: false };
      notify();
      return;
    }

    try {
      const res = await fetch(`${API}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${stored.accessToken}` },
      });

      if (res.ok) {
        const d = await res.json();
        globalState = {
          ...globalState,
          user: d.data,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        };
      } else {
        clearTokens();
        globalState = { ...globalState, isLoading: false };
      }
    } catch {
      globalState = { ...globalState, isLoading: false };
    }
    notify();
  }, []);

  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const stored = getStoredTokens();
    if (!stored.refreshToken) return null;
    try {
      const res = await fetch(`${API}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });
      if (!res.ok) { clearTokens(); notify(); return null; }
      const d = await res.json();
      storeTokens(d.accessToken, d.refreshToken);
      globalState = { ...globalState, accessToken: d.accessToken, refreshToken: d.refreshToken, isAuthenticated: true };
      notify();
      return d.accessToken;
    } catch { return null; }
  }, []);

  return {
    ...globalState,
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

// ═══════════════════════════════════════════════════════════════════════
// STANDALONE HELPER — usable outside React components
// ═══════════════════════════════════════════════════════════════════════

/** Get current auth headers. Returns empty object if not logged in. */
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Fetch with auto token refresh. Use this instead of raw fetch for all API calls. */
export async function apiFetchSafe(url: string, options: RequestInit = {}): Promise<Response> {
  // First attempt
  let res = await apiFetch(url, options);

  // If 401, try refreshing the token
  if (res.status === 401) {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const d = await refreshRes.json();
          localStorage.setItem('accessToken', d.accessToken);
          localStorage.setItem('refreshToken', d.refreshToken);
          // Retry with new token
          const newHeaders = { ...((options.headers as Record<string, string>) || {}) };
          newHeaders['Authorization'] = `Bearer ${d.accessToken}`;
          res = await fetch(url, { ...options, headers: newHeaders });
        }
      } catch {}
    }
  }

  return res;
}

// Auto-refresh session on first load
if (typeof window !== 'undefined') {
  const stored = getStoredTokens();
  if (stored.accessToken) {
    fetch(`${API}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${stored.accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        globalState = {
          ...globalState,
          user: d.data,
          accessToken: stored.accessToken,
          refreshToken: stored.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        };
        notify();
      })
      .catch(() => {
        clearTokens();
        globalState = { ...globalState, isLoading: false };
        notify();
      });
  } else {
    globalState = { ...globalState, isLoading: false };
    notify();
  }
}

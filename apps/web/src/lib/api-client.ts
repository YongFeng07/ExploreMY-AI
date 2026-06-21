/**
 * Centralized API client — single source of truth for all backend communication.
 * Replaces 49+ hardcoded fetch('http://localhost:3001/...') calls across the app.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function getApiUrl(path: string): string {
  const base = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Get current user ID from localStorage (set during login via storeUser) */
export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('userId') || '';
}

interface ApiClientOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Fetch wrapper with automatic auth, timeout, and error handling.
 * Use this instead of raw fetch() for all API calls.
 */
export async function apiClient<T = any>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { timeout = 30000, headers: extraHeaders, ...fetchOptions } = options;
  const url = getApiUrl(path);

  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...extraHeaders,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    if (res.status === 401) {
      // Try token refresh
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        try {
          const refreshRes = await fetch(getApiUrl('/api/v1/auth/refresh'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const d = await refreshRes.json();
            localStorage.setItem('accessToken', d.accessToken);
            localStorage.setItem('refreshToken', d.refreshToken);
            // Retry original request
            const retryHeaders = { ...headers, Authorization: `Bearer ${d.accessToken}` };
            const retryRes = await fetch(url, { ...fetchOptions, headers: retryHeaders });
            if (!retryRes.ok) {
              const err = await retryRes.json().catch(() => ({ message: 'Request failed' }));
              throw new ApiError(err.message || 'Request failed', retryRes.status);
            }
            return retryRes.json();
          }
        } catch {}
      }
      // Clear auth if refresh failed
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new ApiError('Session expired. Please login again.', 401);
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new ApiError(err.message || `HTTP ${res.status}`, res.status);
    }

    return res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Request timed out', 408);
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

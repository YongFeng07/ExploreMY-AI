// Clerk auth helpers for non-React code
// Use these in pages that need auth tokens/user IDs without React hooks

export async function getClerkToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const w = window as any;
    if (w.Clerk?.session) return await w.Clerk.session.getToken();
  } catch { /* noop */ }
  return null;
}

export function getClerkUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const w = window as any;
    return w.Clerk?.user?.id || '';
  } catch { return ''; }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getClerkToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
}

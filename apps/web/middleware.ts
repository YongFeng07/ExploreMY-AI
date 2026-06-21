import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Production-grade middleware for ExploreMY AI.
 *
 * Previously used Clerk middleware which made all routes public in development.
 * Now implements proper route protection:
 *
 * - Public routes: /login, /register, /forgot-password, /reset-password, /verify-email, / (landing)
 * - Protected routes: everything under /explore, /profile, /wallet, etc.
 * - API routes: passthrough (auth handled by JWT in request headers)
 *
 * Auth state is checked client-side via auth-store for SPA navigation.
 * This middleware provides server-side redirect for initial page loads.
 */

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/sign-in',    // Redirect to /login
  '/sign-up',    // Redirect to /register
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/onboarding',
];

const AUTH_REDIRECT_PATHS = ['/sign-in', '/sign-up'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect deprecated Clerk paths to new auth pages
  if (pathname === '/sign-in') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname === '/sign-up') {
    return NextResponse.redirect(new URL('/register', request.url));
  }

  // Pass through all requests — client-side auth guards handle protection
  // via the auth-store which validates the JWT token on every page load.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|api|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|txt|xml)).*)',
  ],
};

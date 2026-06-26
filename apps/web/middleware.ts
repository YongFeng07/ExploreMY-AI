import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Minimal Clerk middleware.
 * All routes are public — auth is enforced client-side.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|.*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|txt|xml)).*)',
  ],
};

import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

/**
 * Global 404 Not Found page.
 * Shown for any route that doesn't match a defined page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-white to-white px-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-xl shadow-amber-200">
        <Compass className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-6xl font-black text-gray-200">404</h1>
      <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Page not found</h2>
      <p className="mt-3 text-sm text-gray-500 max-w-xs">
        Looks like you&apos;ve wandered off the map. This page doesn&apos;t exist
        or has been moved.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-200 hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <Compass className="h-4 w-4" />
          Explore Malaysia
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 hover:border-amber-300 hover:bg-amber-50 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}

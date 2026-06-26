/**
 * Shared image URL resolver — converts relative upload paths to absolute URLs.
 * Previously copy-pasted into 11 files with inconsistent implementations.
 */
const API = process.env.NEXT_PUBLIC_API_URL || '';

export function imgUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  const base = API.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Unsplash photo URL builder — uses stable images.unsplash.com (not deprecated source.unsplash.com).
 * Falls back to a curated set of Malaysian travel photos.
 */
const UNSPLASH_FALLBACKS = [
  'photo-1596422846543-75c6fc197f07', // Malaysian temple
  'photo-1555400038-63f5ba517a47', // Tropical beach
  'photo-1505993598-4e0a6a6a6c4e', // KL skyline
  'photo-1537996194471-e657f9e339cd', // Street food
  'photo-1518548419970-58e3b4079ab2', // Nature/waterfall
  'photo-1548013146-72479768bada', // Heritage building
  'photo-1583417319070-4a69db38a482', // Night market
  'photo-1507525428034-b723cf961d3e', // Beach/sea
  'photo-1544735716-392fe2489ffa', // Mountain view
  'photo-1566438480900-0609be27a4be', // Tea plantation
];

export function unsplashUrl(query?: string, width = 400, height = 300): string {
  const fallback = UNSPLASH_FALLBACKS[Math.floor(Math.random() * UNSPLASH_FALLBACKS.length)];
  if (query) {
    return `https://images.unsplash.com/${fallback}?w=${width}&h=${height}&fit=crop&q=80`;
  }
  return `https://images.unsplash.com/${fallback}?w=${width}&h=${height}&fit=crop&q=80`;
}

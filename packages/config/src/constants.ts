// ── App-wide constants ──

export const APP = {
  NAME: 'ExploreMY',
  VERSION: '1.0.0',
  URL: process.env.NEXT_PUBLIC_APP_URL || 'https://exploremy.ai',
  DESCRIPTION: 'AI-powered travel companion. Discover Malaysia like never before.',
} as const;

// ── API ──
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  TIMEOUT_MS: 30000,
  RETRY_COUNT: 3,
} as const;

// ── Pagination defaults ──
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ── Rate limiting ──
export const RATE_LIMIT = {
  AUTH_WINDOW_MS: 60000,
  AUTH_MAX_REQUESTS: 5,
  AI_WINDOW_MS: 60000,
  AI_MAX_REQUESTS: 10,
  GENERAL_WINDOW_MS: 60000,
  GENERAL_MAX_REQUESTS: 60,
  BLOCK_DURATION_MS: 300000,
} as const;

// ── File upload ──
export const UPLOAD = {
  MAX_AVATAR_SIZE: 5 * 1024 * 1024,    // 5 MB
  MAX_COVER_SIZE: 10 * 1024 * 1024,     // 10 MB
  MAX_PHOTO_SIZE: 10 * 1024 * 1024,     // 10 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

// ── AI ──
export const AI = {
  DEFAULT_MODEL: 'deepseek-chat',
  FALLBACK_MODEL: 'gpt-4o',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
  TIMEOUT_MS: 45000,
} as const;

// ── Subscription tiers ──
export const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    features: ['3 trip plans/month', 'Basic recommendations', 'Community access'],
  },
  {
    id: 'pro',
    name: 'Adventurer',
    price: 29,
    features: ['Unlimited trip plans', 'AI-powered personalization', 'Offline maps', 'Priority support', 'Couple mode'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 99,
    features: ['Everything in Pro', 'Business profile', 'Analytics dashboard', 'Promoted listings', 'API access'],
  },
] as const;

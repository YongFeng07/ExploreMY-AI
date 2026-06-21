import { z } from 'zod';

/**
 * Environment variable schema with Zod validation.
 * Validates at app startup so misconfigurations fail fast.
 */
export const envSchema = z.object({
  // ── App ──
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('debug'),

  // ── Database ──
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  DATABASE_URL_REPLICA: z.string().url().optional(),

  // ── JWT ──
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // ── Redis ──
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().default(0),

  // ── Google Maps ──
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // ── AI ──
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().default('deepseek-chat'),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),

  // ── Supabase ──
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('exploremy-media'),

  // ── Email (Resend) ──
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@exploremy.ai'),

  // ── API Internal ──
  API_INTERNAL_KEY: z.string().optional(),

  // ── S3 / R2 ──
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // ── Stripe ──
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ── Sentry ──
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup.
 * Throws with a descriptive message if any required vars are missing.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  • ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(
      `❌ Invalid environment variables:\n${errors.join('\n')}\n\n` +
        'Check your .env file against .env.example for required values.',
    );
  }
  return result.data;
}

/**
 * Typed environment accessor (call after validateEnv() or in production).
 * Use this for type-safe access to env vars throughout the app.
 */
export const env = validateEnv();

/**
 * @exploremy/config — Shared environment configuration & constants
 *
 * Central place for typed configuration, validated by Zod at startup.
 */

// ── Inline exports to avoid module resolution issues in monorepo ──
export { env, validateEnv } from './env.ts';
export * from './constants.ts';

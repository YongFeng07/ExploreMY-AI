import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.blockedUntil > 0 && entry.blockedUntil < now) store.delete(key);
    if (entry.resetAt < now) store.delete(key);
  }
}, 300000);

/**
 * Production-grade rate limiting guard
 * Usage: @UseGuards(RateLimitGuard({ windowMs: 60000, max: 5 }))
 */
/**
 * Production-grade rate limiting guard
 * Usage: @UseGuards(RateLimitGuard({ windowMs: 60000, max: 5 }))
 */
export function RateLimitGuard(options: { windowMs: number; max: number; blockDurationMs?: number }) {
  const { windowMs, max, blockDurationMs = 300000 } = options;

  @Injectable()
  class Guard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const ip = request.ip || request.connection?.remoteAddress || 'unknown';
      const path = request.route?.path || request.url || 'unknown';
      const key = `${path}:${ip}`;
      const now = Date.now();

      let entry = store.get(key);
      if (!entry || entry.resetAt < now) {
        entry = { count: 0, resetAt: now + windowMs, blockedUntil: 0 };
        store.set(key, entry);
      }

      if (entry.blockedUntil > now) {
        const remainingSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
        throw new HttpException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many requests. Try again in ${remainingSeconds} seconds.`,
          retryAfter: remainingSeconds,
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      entry.count++;
      if (entry.count > max) {
        entry.blockedUntil = now + blockDurationMs;
        throw new HttpException({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded. Blocked for ${Math.ceil(blockDurationMs / 60000)} minutes.`,
          retryAfter: Math.ceil(blockDurationMs / 1000),
        }, HttpStatus.TOO_MANY_REQUESTS);
      }

      return true;
    }
  }
  return Guard;
}

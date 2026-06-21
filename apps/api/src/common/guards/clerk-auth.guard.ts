import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Production-grade authentication guard.
 * Validates JWT Bearer tokens on each request.
 *
 * Usage:
 *   @UseGuards(AuthGuard)           — Requires authentication
 *   @UseGuards(OptionalAuthGuard)   — Authentication optional, user may be null
 *
 * This replaces the previous stub ClerkAuthGuard that defaulted to demo-user-001.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authentication required. Please provide a valid Bearer token.',
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
      throw new UnauthorizedException('Invalid authentication token.');
    }

    // Token validation is performed upstream by the JWT strategy.
    // If we reach here without a user set on the request, the token was invalid.
    if (!request.user || !request.user.userId) {
      throw new UnauthorizedException(
        'Invalid or expired token. Please log in again.',
      );
    }

    return true;
  }
}

/**
 * Optional authentication guard.
 * Attaches user if valid token, allows anonymous access.
 * User is set to null when no valid token is provided.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // User will be set by the optional-jwt Passport strategy if a valid
    // Bearer token is present. Otherwise, it remains null.
    if (!request.user) {
      request.user = null;
    }

    return true;
  }
}

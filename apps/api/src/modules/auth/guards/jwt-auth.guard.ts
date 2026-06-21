import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Production-grade JWT authentication guard.
 *
 * Registered as a GLOBAL guard (APP_GUARD) — ALL endpoints require
 * authentication by default. Mark public endpoints with @Public().
 *
 * Delegates JWT validation to the Passport JWT strategy, which:
 * 1. Extracts the Bearer token from the Authorization header
 * 2. Verifies the JWT signature and expiration
 * 3. Looks up the user in the database
 * 4. Attaches { userId, email, role } to request.user
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // Delegate to Passport JWT strategy for token validation
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Authentication required. Please provide a valid Bearer token.',
        )
      );
    }
    return user;
  }
}

/**
 * Optional authentication guard.
 * Attaches user if valid token, allows anonymous access.
 * Used on endpoints that behave differently for authenticated vs anonymous users.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('optional-jwt') {
  handleRequest(err: any, user: any) {
    // Return null instead of throwing — allows anonymous access
    return user || null;
  }
}

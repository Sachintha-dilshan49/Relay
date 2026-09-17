import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { RequestWithTenant } from '../interfaces/request-with-tenant.interface';

// Metadata key used by @Public() decorator
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * ApiKeyGuard
 *
 * Applied globally to ALL routes in main.ts (via APP_GUARD).
 * Extracts the Bearer token from the Authorization header,
 * validates it, and attaches the tenant to the request object.
 *
 * Routes decorated with @Public() skip this guard entirely.
 *
 * Usage in controllers:
 *   @UseGuards(ApiKeyGuard)   ← not needed if applied globally
 *   @Get('example')
 *   example(@CurrentTenant() tenant: Tenant) { ... }
 *
 * To make a route public (no API key required):
 *   @Public()
 *   @Get('health')
 *   health() { ... }
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── Check if route is marked @Public() ──────────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Skip auth for public routes
    }

    // ── Extract Bearer token from Authorization header ───────────────────────
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing Authorization header. Expected: Authorization: Bearer <api-key>',
      );
    }

    const rawKey = authHeader.substring(7); // Remove "Bearer " prefix

    if (!rawKey || rawKey.trim() === '') {
      throw new UnauthorizedException('API key cannot be empty');
    }

    // ── Validate the key and attach tenant to request ────────────────────────
    const tenant = await this.authService.validateApiKey(rawKey);
    request.tenant = tenant; // Now available via @CurrentTenant() in controllers

    return true;
  }
}

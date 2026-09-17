import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Tenant } from '@relay/database';
import { RequestWithTenant } from '../interfaces/request-with-tenant.interface';
import { IS_PUBLIC_KEY } from '../guards/api-key.guard';

/**
 * @CurrentTenant()
 *
 * Parameter decorator that extracts the authenticated tenant from the request.
 * Only works on routes protected by ApiKeyGuard (which is all routes by default).
 *
 * @example
 * @Get('templates')
 * getTemplates(@CurrentTenant() tenant: Tenant) {
 *   return this.templatesService.findAll(tenant.id);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Tenant => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenant;
  },
);

/**
 * @Public()
 *
 * Class or method decorator that marks a route as public.
 * Routes with this decorator skip API key validation entirely.
 *
 * @example
 * @Public()
 * @Get('health')
 * health() { return { status: 'ok' }; }
 *
 * @example — apply to whole controller
 * @Public()
 * @Controller('health')
 * export class HealthController { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

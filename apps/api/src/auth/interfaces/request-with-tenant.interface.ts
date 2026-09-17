import { Request } from 'express';
import { Tenant } from '@relay/database';

/**
 * Extended Express Request interface.
 *
 * After the ApiKeyGuard runs, the validated tenant is attached to the request.
 * Use the @CurrentTenant() decorator in controllers to access it cleanly.
 */
export interface RequestWithTenant extends Request {
  tenant: Tenant;
}

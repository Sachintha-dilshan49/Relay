import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Tenant } from '@relay/database';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  TenantResponseDto,
  RegisterTenantResponseDto,
} from './dto/tenant-response.dto';
import {
  Public,
  CurrentTenant,
} from '../auth/decorators/current-tenant.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /api/v1/tenants
   *
   * Registers a new tenant. Returns the tenant details and their first API key.
   * This is the ONLY time the raw API key is returned — save it securely.
   *
   * This route is @Public — no API key needed to register.
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new tenant',
    description:
      'Creates a new tenant account and returns the first API key. ' +
      'The API key is shown only once — store it securely.',
  })
  @ApiCreatedResponse({
    description: 'Tenant registered successfully',
    type: RegisterTenantResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Slug or email already in use',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error — check request body',
  })
  register(@Body() dto: CreateTenantDto): Promise<RegisterTenantResponseDto> {
    return this.tenantsService.register(dto);
  }

  /**
   * GET /api/v1/tenants/me
   *
   * Returns the currently authenticated tenant's details.
   * Requires a valid API key in the Authorization header.
   */
  @Get('me')
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary: 'Get current tenant',
    description: 'Returns the tenant associated with the API key used.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant details',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  getCurrent(@CurrentTenant() tenant: Tenant): Promise<TenantResponseDto> {
    return this.tenantsService.getCurrent(tenant.id);
  }

  /**
   * PATCH /api/v1/tenants/me
   *
   * Updates the current tenant's name and/or email.
   * Slug is immutable and cannot be changed.
   */
  @Patch('me')
  @ApiBearerAuth('api-key')
  @ApiOperation({
    summary: 'Update current tenant',
    description:
      'Updates name and/or email for the authenticated tenant. ' +
      'Slug cannot be changed after registration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  updateCurrent(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.updateCurrent(tenant.id, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Tenant } from '@relay/database';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import {
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  RevokeApiKeyResponseDto,
} from './dto/api-key-response.dto';

@ApiTags('api-keys')
@ApiBearerAuth('api-key')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * GET /api/v1/api-keys
   * Lists all API keys for the authenticated tenant.
   * Only shows safe fields — never the raw key or hash.
   */
  @Get()
  @ApiOperation({
    summary: 'List API keys',
    description:
      'Returns all API keys for the authenticated tenant. ' +
      'Raw key values are never returned — only the prefix for identification.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    type: [ApiKeyResponseDto],
  })
  list(@CurrentTenant() tenant: Tenant): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.list(tenant.id);
  }

  /**
   * POST /api/v1/api-keys
   * Creates a new API key for the authenticated tenant.
   * The raw key is returned ONCE — it will never be shown again.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create API key',
    description:
      'Generates a new API key for the tenant. ' +
      'The raw key is returned only in this response — save it securely.',
  })
  @ApiResponse({
    status: 201,
    description: 'API key created — raw key shown once only',
    type: CreateApiKeyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: CreateApiKeyDto,
  ): Promise<CreateApiKeyResponseDto> {
    return this.apiKeysService.create(tenant.id, dto);
  }

  /**
   * DELETE /api/v1/api-keys/:id
   * Revokes an API key immediately.
   * The key stops working on the next request — Redis cache is cleared instantly.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke API key',
    description:
      'Revokes an API key immediately. ' +
      'The key stops working right away — Redis cache is invalidated on revoke.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the API key to revoke' })
  @ApiResponse({
    status: 200,
    description: 'Key revoked successfully',
    type: RevokeApiKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 403, description: 'Key already revoked' })
  revoke(
    @CurrentTenant() tenant: Tenant,
    @Param('id') keyId: string,
  ): Promise<RevokeApiKeyResponseDto> {
    return this.apiKeysService.revoke(tenant.id, keyId);
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { prisma } from '@relay/database';
import { AuthService } from '../auth/auth.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import {
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  RevokeApiKeyResponseDto,
} from './dto/api-key-response.dto';

// Redis cache prefix — must match the one in AuthService
const CACHE_PREFIX = 'relay:apikey:';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly authService: AuthService) {}

  // ─── List ─────────────────────────────────────────────────────────────────

  /**
   * Returns all API keys for a tenant.
   * Never includes keyHash or the raw key — only safe display fields.
   */
  async list(tenantId: string): Promise<ApiKeyResponseDto[]> {
    const keys = await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => this.toResponseDto(k));
  }

  // ─── Create ───────────────────────────────────────────────────────────────

  /**
   * Generates a new API key for the tenant.
   * Returns the raw key ONCE — it is never stored or retrievable again.
   */
  async create(
    tenantId: string,
    dto: CreateApiKeyDto,
  ): Promise<CreateApiKeyResponseDto> {
    const { rawKey, keyHash, keyPrefix } = this.authService.generateApiKey('live');

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyHash,
        keyPrefix,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    this.logger.log(
      `New API key created: "${dto.name}" for tenant ${tenantId}`,
    );

    return {
      ...this.toResponseDto(apiKey),
      rawKey,   // ← Only time raw key is returned
      message: 'API key created. Save it now — it will not be shown again.',
    };
  }

  // ─── Revoke ───────────────────────────────────────────────────────────────

  /**
   * Revokes (soft-deletes) an API key by setting isActive = false.
   * Also immediately invalidates the Redis cache for that key
   * so it stops working on the next request — no waiting for TTL to expire.
   *
   * Tenants can only revoke their own keys.
   */
  async revoke(
    tenantId: string,
    keyId: string,
  ): Promise<RevokeApiKeyResponseDto> {
    // ── Find the key and verify it belongs to this tenant ─────────────────
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key not found`);
    }

    if (apiKey.tenantId !== tenantId) {
      // Return 404 instead of 403 — don't reveal the key exists for another tenant
      throw new NotFoundException(`API key not found`);
    }

    if (!apiKey.isActive) {
      throw new ForbiddenException(`API key is already revoked`);
    }

    // ── Soft delete — set isActive = false ────────────────────────────────
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // ── Immediately invalidate Redis cache ────────────────────────────────
    // So the key stops working right away, not after the 5-min TTL expires
    const cacheKey = `${CACHE_PREFIX}${apiKey.keyHash}`;
    await this.authService.invalidateCache(apiKey.keyHash);

    this.logger.log(
      `API key revoked: "${apiKey.name}" (${keyId}) for tenant ${tenantId}`,
    );

    return {
      message: 'API key revoked successfully',
      id: keyId,
    };
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  /**
   * Maps a Prisma ApiKey to the safe response shape.
   * keyHash is NEVER included in any response.
   */
  private toResponseDto(apiKey: {
    id: string;
    name: string;
    keyPrefix: string;
    isActive: boolean;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      isActive: apiKey.isActive,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }
}

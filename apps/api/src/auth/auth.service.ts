import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { prisma, Tenant } from '@relay/database';
import { RedisService } from '../redis/redis.service';

// How long a validated API key stays cached in Redis (seconds)
const API_KEY_CACHE_TTL = 300; // 5 minutes

// Redis key prefix for API key cache entries
const CACHE_PREFIX = 'relay:apikey:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly redisService: RedisService) {}

  // ─── Validate ─────────────────────────────────────────────────────────────

  /**
   * Validates an incoming API key and returns the associated tenant.
   *
   * Strategy:
   * 1. Hash the raw key with SHA-256 (deterministic — enables O(1) DB lookup)
   * 2. Check Redis cache first (avoids DB hit on every request)
   * 3. If not cached, query PostgreSQL by hash
   * 4. Verify key is active and not expired
   * 5. Cache the tenant for 5 minutes
   * 6. Update lastUsedAt in the background (non-blocking)
   *
   * @throws UnauthorizedException if key is missing, invalid, or expired
   */
  async validateApiKey(rawKey: string): Promise<Tenant> {
    if (!rawKey) {
      throw new UnauthorizedException('API key is required');
    }

    const keyHash = this.hashKey(rawKey);
    const cacheKey = `${CACHE_PREFIX}${keyHash}`;

    // ── 1. Check Redis cache ────────────────────────────────────────────────
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      this.logger.debug(`API key cache hit`);
      return JSON.parse(cached) as Tenant;
    }

    // ── 2. Query PostgreSQL ─────────────────────────────────────────────────
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });

    if (!apiKey || !apiKey.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    // ── 3. Check expiry ─────────────────────────────────────────────────────
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // ── 4. Check tenant is active ───────────────────────────────────────────
    if (!apiKey.tenant.isActive) {
      throw new UnauthorizedException('Tenant account is inactive');
    }

    // ── 5. Cache tenant ─────────────────────────────────────────────────────
    await this.redisService.set(
      cacheKey,
      JSON.stringify(apiKey.tenant),
      API_KEY_CACHE_TTL,
    );

    // ── 6. Update lastUsedAt (fire and forget — don't block the request) ───
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch((err) => this.logger.error('Failed to update lastUsedAt', err));

    this.logger.debug(`API key validated for tenant: ${apiKey.tenant.slug}`);
    return apiKey.tenant;
  }

  // ─── Key generation ───────────────────────────────────────────────────────

  /**
   * Generates a new API key string and its hash for storage.
   *
   * Returns:
   * - rawKey   → shown to the user ONCE, never stored
   * - keyHash  → stored in the database
   * - keyPrefix → first 16 chars, shown in the UI for identification
   *
   * @example
   * { rawKey: "relay_live_a1b2c3...", keyHash: "sha256hash...", keyPrefix: "relay_live_a1b2" }
   */
  generateApiKey(type: 'live' | 'test' = 'live'): {
    rawKey: string;
    keyHash: string;
    keyPrefix: string;
  } {
    const random = randomBytes(24).toString('hex');
    const rawKey = `relay_${type}_${random}`;
    const keyHash = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 16);

    return { rawKey, keyHash, keyPrefix };
  }

  /**
   * Invalidates a cached API key (call after revoking a key).
   */
  async invalidateCache(keyHash: string): Promise<void> {
    await this.redisService.del(`${CACHE_PREFIX}${keyHash}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * SHA-256 hash of the raw key.
   * Deterministic — same key always produces the same hash.
   * Allows direct database lookup without scanning all keys.
   */
  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }
}

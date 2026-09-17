import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { prisma, Tenant } from '@relay/database';
import { AuthService } from '../auth/auth.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  TenantResponseDto,
  RegisterTenantResponseDto,
} from './dto/tenant-response.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly authService: AuthService) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  /**
   * Registers a new tenant and generates their first API key.
   *
   * Steps:
   * 1. Check slug is not already taken
   * 2. Check email is not already registered
   * 3. Create tenant record
   * 4. Generate API key (raw + hash)
   * 5. Store hashed key in DB
   * 6. Return tenant + RAW key (only time it is exposed)
   */
  async register(dto: CreateTenantDto): Promise<RegisterTenantResponseDto> {
    // ── 1. Check slug uniqueness ─────────────────────────────────────────────
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(
        `The slug "${dto.slug}" is already taken. Please choose a different one.`,
      );
    }

    // ── 2. Check email uniqueness ────────────────────────────────────────────
    const existingEmail = await prisma.tenant.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException(
        `An account with email "${dto.email}" already exists.`,
      );
    }

    // ── 3. Generate API key before writing to DB ─────────────────────────────
    const { rawKey, keyHash, keyPrefix } = this.authService.generateApiKey('live');

    // ── 4. Create tenant + API key in a single transaction ───────────────────
    const tenant = await prisma.$transaction(async (tx) => {
      // Create the tenant
      const newTenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          email: dto.email,
        },
      });

      // Create the first API key for the tenant
      await tx.apiKey.create({
        data: {
          tenantId: newTenant.id,
          name: 'Default Key',
          keyHash,
          keyPrefix,
        },
      });

      return newTenant;
    });

    this.logger.log(`New tenant registered: ${tenant.slug} (${tenant.id})`);

    return {
      tenant: this.toResponseDto(tenant),
      apiKey: rawKey,         // ← RAW key returned ONCE here, never stored plain
      apiKeyPrefix: keyPrefix,
      message:
        'Tenant registered successfully. Save your API key — it will not be shown again.',
    };
  }

  // ─── Get current ───────────────────────────────────────────────────────────

  /**
   * Returns the current authenticated tenant's details.
   * The tenant is already resolved by ApiKeyGuard and passed via @CurrentTenant().
   */
  async getCurrent(tenantId: string): Promise<TenantResponseDto> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return this.toResponseDto(tenant);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /**
   * Updates the current tenant's name and/or email.
   * Slug cannot be changed (immutable after registration).
   */
  async updateCurrent(
    tenantId: string,
    dto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    // Check email uniqueness if email is being changed
    if (dto.email) {
      const emailTaken = await prisma.tenant.findFirst({
        where: {
          email: dto.email,
          NOT: { id: tenantId }, // Exclude current tenant
        },
      });
      if (emailTaken) {
        throw new ConflictException(
          `Email "${dto.email}" is already in use by another account.`,
        );
      }
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
      },
    });

    this.logger.log(`Tenant updated: ${updated.slug}`);
    return this.toResponseDto(updated);
  }

  // ─── Helper ────────────────────────────────────────────────────────────────

  /**
   * Maps a Prisma Tenant model to TenantResponseDto.
   * Ensures internal fields never leak to the API response.
   */
  private toResponseDto(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
    };
  }
}

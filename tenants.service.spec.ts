import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { AuthService } from '../auth/auth.service';

// Mock Prisma
jest.mock('@relay/database', () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@relay/database';

const mockAuthService = {
  generateApiKey: jest.fn().mockReturnValue({
    rawKey: 'relay_live_testkey123',
    keyHash: 'abc123hash',
    keyPrefix: 'relay_live_test',
  }),
};

const fakeTenant = {
  id: 'tenant-uuid',
  name: 'Test Corp',
  slug: 'test-corp',
  email: 'admin@test.com',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TenantsService', () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  // ─── register ──────────────────────────────────────────────────────────────

  describe('register()', () => {
    const dto = { name: 'Test Corp', slug: 'test-corp', email: 'admin@test.com' };

    it('should register a new tenant and return API key', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.$transaction as jest.Mock).mockResolvedValue(fakeTenant);

      const result = await service.register(dto);

      expect(result.tenant.slug).toBe('test-corp');
      expect(result.apiKey).toBe('relay_live_testkey123');
      expect(result.message).toContain('will not be shown again');
    });

    it('should throw ConflictException if slug already taken', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValueOnce(fakeTenant);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if email already registered', async () => {
      (prisma.tenant.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)        // slug not taken
        .mockResolvedValueOnce(fakeTenant); // email taken

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ─── getCurrent ────────────────────────────────────────────────────────────

  describe('getCurrent()', () => {
    it('should return the tenant details', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(fakeTenant);

      const result = await service.getCurrent('tenant-uuid');
      expect(result.id).toBe('tenant-uuid');
      expect(result.slug).toBe('test-corp');
    });

    it('should throw NotFoundException if tenant not found', async () => {
      (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getCurrent('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateCurrent ─────────────────────────────────────────────────────────

  describe('updateCurrent()', () => {
    it('should update and return tenant', async () => {
      (prisma.tenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tenant.update as jest.Mock).mockResolvedValue({
        ...fakeTenant,
        name: 'Updated Corp',
      });

      const result = await service.updateCurrent('tenant-uuid', { name: 'Updated Corp' });
      expect(result.name).toBe('Updated Corp');
    });

    it('should throw ConflictException if new email already used', async () => {
      (prisma.tenant.findFirst as jest.Mock).mockResolvedValue(fakeTenant);

      await expect(
        service.updateCurrent('tenant-uuid', { email: 'taken@other.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

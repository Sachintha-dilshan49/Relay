import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { AuthService } from '../auth/auth.service';

jest.mock('@relay/database', () => ({
  prisma: {
    apiKey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@relay/database';

const mockAuthService = {
  generateApiKey: jest.fn().mockReturnValue({
    rawKey: 'relay_live_newkey123456',
    keyHash: 'newhash123',
    keyPrefix: 'relay_live_newk',
  }),
  invalidateCache: jest.fn(),
};

const fakeKey = {
  id: 'key-uuid',
  tenantId: 'tenant-uuid',
  name: 'Production Key',
  keyPrefix: 'relay_live_a1b2',
  keyHash: 'hashvalue',
  isActive: true,
  lastUsedAt: null,
  expiresAt: null,
  createdAt: new Date(),
};

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    jest.clearAllMocks();
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list()', () => {
    it('should return all keys for the tenant', async () => {
      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([fakeKey]);

      const result = await service.list('tenant-uuid');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Production Key');
    });

    it('should never include keyHash in the response', async () => {
      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([fakeKey]);

      const result = await service.list('tenant-uuid');

      expect((result[0] as Record<string, unknown>)['keyHash']).toBeUndefined();
    });

    it('should return empty array if no keys exist', async () => {
      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.list('tenant-uuid');
      expect(result).toEqual([]);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should return the raw key only on creation', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue(fakeKey);

      const result = await service.create('tenant-uuid', { name: 'New Key' });

      expect(result.rawKey).toBe('relay_live_newkey123456');
      expect(result.message).toContain('will not be shown again');
    });

    it('should call generateApiKey from AuthService', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue(fakeKey);

      await service.create('tenant-uuid', { name: 'New Key' });

      expect(mockAuthService.generateApiKey).toHaveBeenCalledWith('live');
    });
  });

  // ─── revoke ───────────────────────────────────────────────────────────────

  describe('revoke()', () => {
    it('should revoke key and invalidate cache', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(fakeKey);
      (prisma.apiKey.update as jest.Mock).mockResolvedValue({
        ...fakeKey,
        isActive: false,
      });

      const result = await service.revoke('tenant-uuid', 'key-uuid');

      expect(result.message).toBe('API key revoked successfully');
      expect(mockAuthService.invalidateCache).toHaveBeenCalledWith('hashvalue');
    });

    it('should throw NotFoundException if key does not exist', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.revoke('tenant-uuid', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if key belongs to another tenant', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        ...fakeKey,
        tenantId: 'other-tenant', // Different tenant
      });

      await expect(
        service.revoke('tenant-uuid', 'key-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if key already revoked', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        ...fakeKey,
        isActive: false, // Already revoked
      });

      await expect(
        service.revoke('tenant-uuid', 'key-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

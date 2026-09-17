import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';

// Mock RedisService so tests don't need a real Redis instance
const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// Mock Prisma so tests don't need a real database
jest.mock('@relay/database', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@relay/database';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Clear all mock state between tests
    jest.clearAllMocks();
  });

  // ─── generateApiKey ────────────────────────────────────────────────────────

  describe('generateApiKey()', () => {
    it('should generate a live key with correct prefix', () => {
      const result = service.generateApiKey('live');
      expect(result.rawKey).toMatch(/^relay_live_/);
    });

    it('should generate a test key with correct prefix', () => {
      const result = service.generateApiKey('test');
      expect(result.rawKey).toMatch(/^relay_test_/);
    });

    it('should return a non-empty hash', () => {
      const result = service.generateApiKey();
      expect(result.keyHash).toHaveLength(64); // SHA-256 hex = 64 chars
    });

    it('should return a keyPrefix of 16 characters', () => {
      const result = service.generateApiKey();
      expect(result.keyPrefix).toHaveLength(16);
    });

    it('should generate unique keys on each call', () => {
      const key1 = service.generateApiKey();
      const key2 = service.generateApiKey();
      expect(key1.rawKey).not.toBe(key2.rawKey);
      expect(key1.keyHash).not.toBe(key2.keyHash);
    });
  });

  // ─── validateApiKey ────────────────────────────────────────────────────────

  describe('validateApiKey()', () => {
    const fakeTenant = {
      id: 'tenant-uuid',
      name: 'Test Tenant',
      slug: 'test-tenant',
      isActive: true,
    };

    it('should return tenant from Redis cache if cached', async () => {
      mockRedisService.get.mockResolvedValue(JSON.stringify(fakeTenant));

      const result = await service.validateApiKey('relay_live_abc123');

      expect(result).toEqual(fakeTenant);
      expect(prisma.apiKey.findUnique).not.toHaveBeenCalled(); // DB not hit
    });

    it('should query DB and cache result on cache miss', async () => {
      mockRedisService.get.mockResolvedValue(null); // Cache miss
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-uuid',
        isActive: true,
        expiresAt: null,
        tenant: fakeTenant,
      });
      (prisma.apiKey.update as jest.Mock).mockResolvedValue({});

      const result = await service.validateApiKey('relay_live_abc123');

      expect(result).toEqual(fakeTenant);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('relay:apikey:'),
        JSON.stringify(fakeTenant),
        300,
      );
    });

    it('should throw UnauthorizedException for invalid key', async () => {
      mockRedisService.get.mockResolvedValue(null);
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null); // Not found

      await expect(service.validateApiKey('relay_live_invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired key', async () => {
      mockRedisService.get.mockResolvedValue(null);
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-uuid',
        isActive: true,
        expiresAt: new Date('2020-01-01'), // Expired in the past
        tenant: fakeTenant,
      });

      await expect(service.validateApiKey('relay_live_expired')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for empty key', async () => {
      await expect(service.validateApiKey('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if tenant is inactive', async () => {
      mockRedisService.get.mockResolvedValue(null);
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-uuid',
        isActive: true,
        expiresAt: null,
        tenant: { ...fakeTenant, isActive: false }, // Inactive tenant
      });

      await expect(service.validateApiKey('relay_live_abc123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

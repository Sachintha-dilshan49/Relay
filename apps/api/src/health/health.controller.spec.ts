import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return status ok', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.check();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should return a non-negative uptime', () => {
      const result = controller.check();
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return the current environment', () => {
      const result = controller.check();
      expect(result.environment).toBeDefined();
    });
  });
});

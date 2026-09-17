import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {

  /**
   * GET /health
   * Simple liveness check — confirms the API process is running.
   * Used by Docker healthcheck and monitoring tools.
   */
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns OK if the API service is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-01T10:00:00.000Z',
        uptime: 3600,
        environment: 'development',
        version: '0.1.0',
      },
    },
  })
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
      version: '0.1.0',
    };
  }
}

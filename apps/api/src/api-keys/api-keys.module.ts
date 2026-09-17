import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { AuthModule } from '../auth/auth.module';

/**
 * ApiKeysModule — F-07
 *
 * Handles API key management for tenants:
 * listing, creating, and revoking keys.
 */
@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}

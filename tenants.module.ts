import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { AuthModule } from '../auth/auth.module';

/**
 * TenantsModule — F-06
 *
 * Handles tenant registration and account management.
 * Imports AuthModule to use AuthService for API key generation.
 */
@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}

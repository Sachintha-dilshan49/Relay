import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * AuthModule
 *
 * Provides:
 * - AuthService   → API key validation + key generation
 * - ApiKeyGuard   → Applied globally via APP_GUARD (protects all routes)
 *
 * The APP_GUARD token registers ApiKeyGuard as a global guard,
 * meaning every route in the app requires a valid API key by default.
 * Use @Public() on routes that should be accessible without a key.
 */
@Module({
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard, // Applied globally — no need to add @UseGuards() in controllers
    },
  ],
  exports: [AuthService], // Export so other modules can use AuthService
})
export class AuthModule {}

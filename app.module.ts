import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // ─── Infrastructure ──────────────────────────────────────────────────────
    RedisModule,   // Global — available everywhere, no need to re-import

    // ─── Auth ────────────────────────────────────────────────────────────────
    AuthModule,    // Registers ApiKeyGuard globally via APP_GUARD

    // ─── Feature modules ─────────────────────────────────────────────────────
    HealthModule,

    // TODO: Add as contributors build them (see docs/Features.md)
    // TenantsModule,       → F-06
    // ApiKeysModule,       → F-07
    // TemplatesModule,     → F-08
    // NotificationsModule, → F-09
    // QueueModule,         → F-10
    // AnalyticsModule,     → F-18
  ],
})
export class AppModule {}

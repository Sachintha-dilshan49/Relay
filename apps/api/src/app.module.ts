import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ApiKeysModule } from './api-keys/api-keys.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),

    // ─── Infrastructure ──────────────────────────────────────────────────────
    RedisModule,

    // ─── Auth ────────────────────────────────────────────────────────────────
    AuthModule,

    // ─── Feature modules ─────────────────────────────────────────────────────
    HealthModule,
    TenantsModule,   // F-06 ✅
    ApiKeysModule,   // F-07 ✅

    // TODO: Add as contributors build them (see docs/Features.md)
    // TemplatesModule,     → F-08
    // NotificationsModule, → F-09
    // QueueModule,         → F-10
    // AnalyticsModule,     → F-18
  ],
})
export class AppModule {}

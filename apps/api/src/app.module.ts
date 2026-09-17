import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────────────────────
    // Loads .env file and makes ConfigService available across all modules
    ConfigModule.forRoot({
      isGlobal: true,       // No need to import ConfigModule in every module
      envFilePath: '.env',
      cache: true,          // Cache env values for performance
    }),

    // ─── Feature modules ─────────────────────────────────────────────────────
    // Add new feature modules here as they are built
    HealthModule,

    // TODO: Add these modules as contributors build them (see docs/Features.md)
    // AuthModule,          → F-05
    // TenantsModule,       → F-06
    // ApiKeysModule,       → F-07
    // TemplatesModule,     → F-08
    // NotificationsModule, → F-09
    // QueueModule,         → F-10
    // AnalyticsModule,     → F-18
  ],
})
export class AppModule {}

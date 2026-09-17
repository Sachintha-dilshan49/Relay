import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

/**
 * RedisModule
 *
 * Global module — import once in AppModule, available everywhere.
 * Provides RedisService for caching API keys, rate limiting, etc.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

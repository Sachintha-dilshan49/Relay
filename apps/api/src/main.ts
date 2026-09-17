import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const apiVersion = configService.get<string>('API_VERSION', 'v1');

  // ─── Global prefix ───────────────────────────────────────────────────────
  app.setGlobalPrefix(`api/${apiVersion}`, {
    exclude: ['health'], // Health check has no prefix
  });

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Global validation pipe ───────────────────────────────────────────────
  // All incoming request bodies are validated against their DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip unknown properties from body
      forbidNonWhitelisted: true, // Throw error if unknown properties sent
      transform: true,         // Auto-transform types (string → number etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global exception filter ──────────────────────────────────────────────
  // Returns consistent JSON error responses for all exceptions
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Global logging interceptor ───────────────────────────────────────────
  // Logs every incoming request and its response time
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ─── Swagger (API docs) ───────────────────────────────────────────────────
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';

  if (swaggerEnabled) {
    const swaggerPath = configService.get<string>('SWAGGER_PATH', 'api/docs');

    const config = new DocumentBuilder()
      .setTitle('Relay — Notification Platform API')
      .setDescription(
        'Open-source notification infrastructure API. ' +
        'Send email, SMS, push, and webhook notifications through a single endpoint.',
      )
      .setVersion('0.1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY',
          description: 'Enter your Relay API key',
        },
        'api-key',
      )
      .addTag('notifications', 'Send and manage notifications')
      .addTag('templates', 'Notification template management')
      .addTag('tenants', 'Tenant account management')
      .addTag('api-keys', 'API key management')
      .addTag('analytics', 'Delivery analytics and stats')
      .addTag('health', 'Health check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger docs available at http://localhost:${port}/${swaggerPath}`);
  }

  // ─── Start ────────────────────────────────────────────────────────────────
  await app.listen(port);

  logger.log(`🚀 Relay API running in [${nodeEnv}] mode on port ${port}`);
  logger.log(`📡 API base URL: http://localhost:${port}/api/${apiVersion}`);
  logger.log(`❤️  Health check: http://localhost:${port}/health`);
}

bootstrap();

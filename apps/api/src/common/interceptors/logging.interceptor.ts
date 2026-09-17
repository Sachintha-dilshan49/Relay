import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Global Logging Interceptor
 *
 * Logs every incoming HTTP request and how long it took to respond.
 * Applied globally in main.ts via app.useGlobalInterceptors().
 *
 * Output example:
 *   [LoggingInterceptor] POST /api/v1/notify → 202 (45ms)
 *   [LoggingInterceptor] GET  /health        → 200 (2ms)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        this.logger.log(`${method.padEnd(6)} ${url} → ${statusCode} (${duration}ms)`);
      }),
    );
  }
}

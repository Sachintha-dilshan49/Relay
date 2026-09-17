import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsDateString,
} from 'class-validator';

/**
 * CreateApiKeyDto
 *
 * Validates the request body for POST /api-keys.
 */
export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Human-readable label for this key — helps identify it in the dashboard',
    example: 'Production Server',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Optional expiry date (ISO 8601). If omitted the key never expires.',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

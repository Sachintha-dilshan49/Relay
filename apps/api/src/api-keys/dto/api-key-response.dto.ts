import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ApiKeyResponseDto
 *
 * Returned on GET /api-keys (list view).
 * Never includes the raw key or the hash — only safe fields.
 */
export class ApiKeyResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Production Server' })
  name: string;

  @ApiProperty({
    description: 'First 16 characters of the key for identification only',
    example: 'relay_live_a1b2c3',
  })
  keyPrefix: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Last time this key was used to make a request',
    example: '2024-01-15T08:30:00.000Z',
    nullable: true,
  })
  lastUsedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Expiry date. Null means the key never expires.',
    example: null,
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;
}

/**
 * CreateApiKeyResponseDto
 *
 * Returned ONLY on POST /api-keys.
 * Includes the raw key — shown ONCE, never again.
 */
export class CreateApiKeyResponseDto extends ApiKeyResponseDto {
  @ApiProperty({
    description:
      'Your API key. Copy and store this securely — it will NOT be shown again.',
    example: 'relay_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  rawKey: string;

  @ApiProperty({
    example: 'API key created. Save it now — it will not be shown again.',
  })
  message: string;
}

/**
 * RevokeApiKeyResponseDto
 *
 * Returned on DELETE /api-keys/:id.
 */
export class RevokeApiKeyResponseDto {
  @ApiProperty({ example: 'API key revoked successfully' })
  message: string;

  @ApiProperty({ example: 'uuid-here' })
  id: string;
}

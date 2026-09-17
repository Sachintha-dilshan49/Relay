import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * TenantResponseDto
 *
 * Shapes the tenant object returned in API responses.
 * Excludes internal fields that clients should not see.
 */
export class TenantResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  slug: string;

  @ApiProperty({ example: 'admin@acme.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;
}

/**
 * RegisterTenantResponseDto
 *
 * Returned ONLY on POST /tenants (registration).
 * Includes the raw API key — this is the ONLY time it is shown.
 * After this response, the plain key is gone forever.
 */
export class RegisterTenantResponseDto {
  @ApiProperty({ type: TenantResponseDto })
  tenant: TenantResponseDto;

  @ApiProperty({
    description:
      'Your API key. Store this securely — it will NOT be shown again.',
    example: 'relay_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  })
  apiKey: string;

  @ApiPropertyOptional({
    description: 'Key prefix shown in the dashboard for identification',
    example: 'relay_live_a1b2',
  })
  apiKeyPrefix: string;

  @ApiProperty({
    example:
      'Tenant registered successfully. Save your API key — it will not be shown again.',
  })
  message: string;
}

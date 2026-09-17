import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * UpdateTenantDto
 *
 * Validates the request body for PATCH /tenants/me.
 * All fields are optional — only provided fields are updated.
 * Slug cannot be changed after registration (would break integrations).
 */
export class UpdateTenantDto {
  @ApiPropertyOptional({
    description: 'New display name for the organisation',
    example: 'Acme Corporation',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'New contact email for the tenant',
    example: 'newemail@acme.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

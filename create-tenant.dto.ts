import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

/**
 * CreateTenantDto
 *
 * Validates the request body for POST /tenants (tenant registration).
 * class-validator decorators automatically reject invalid input
 * via the global ValidationPipe set up in main.ts.
 */
export class CreateTenantDto {
  @ApiProperty({
    description: 'Display name of the organisation',
    example: 'Acme Corp',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description:
      'Unique URL-safe identifier for the tenant. ' +
      'Lowercase letters, numbers, and hyphens only.',
    example: 'acme-corp',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug may only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({
    description: 'Contact or billing email address for the tenant',
    example: 'admin@acme.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

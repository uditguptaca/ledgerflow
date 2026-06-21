import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVendorDto {
  @ApiProperty({ description: 'The vendor name', example: 'Office Supplies Inc' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The vendor email address', example: 'orders@officesupplies.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'The vendor phone number', example: '+1-555-0122' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'The vendor website', example: 'https://officesupplies.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'The vendor tax ID / TIN number', example: 'US987654321' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Address object', example: { street: '456 Business Rd', city: 'New York', state: 'NY', zip: '10001', country: 'US' } })
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ description: 'Default payment terms in days', example: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultTerms?: number;

  @ApiPropertyOptional({ description: 'Internal notes about the vendor', example: 'Primary office supply vendor' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateVendorDto {
  @ApiPropertyOptional({ description: 'The vendor name', example: 'Office Supplies Inc' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The vendor email address', example: 'orders@officesupplies.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'The vendor phone number', example: '+1-555-0122' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'The vendor website', example: 'https://officesupplies.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'The vendor tax ID / TIN number', example: 'US987654321' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Address object' })
  @IsOptional()
  address?: any;

  @ApiPropertyOptional({ description: 'Default payment terms in days', example: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultTerms?: number;

  @ApiPropertyOptional({ description: 'Internal notes about the vendor', example: 'Primary office supply vendor' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the vendor is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GetVendorsFilterDto {
  @ApiPropertyOptional({ description: 'Search term for name or email', example: 'Supplies' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active state', example: true })
  @IsOptional()
  isActive?: boolean;
}

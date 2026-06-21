import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: 'The customer name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'The customer email address', example: 'billing@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'The customer phone number', example: '+1-555-0199' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'The customer website', example: 'https://acme.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'The customer tax ID / VAT number', example: 'US123456789' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Billing address object', example: { street: '123 Main St', city: 'Boston', state: 'MA', zip: '02108', country: 'US' } })
  @IsOptional()
  billingAddress?: any;

  @ApiPropertyOptional({ description: 'Shipping address object', example: { street: '123 Main St', city: 'Boston', state: 'MA', zip: '02108', country: 'US' } })
  @IsOptional()
  shippingAddress?: any;

  @ApiPropertyOptional({ description: 'Default terms in days', example: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultTerms?: number;

  @ApiPropertyOptional({ description: 'Credit limit amount', example: 5000.00 })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Internal notes about the customer', example: 'VIP Customer' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'The customer name', example: 'Acme Corp' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'The customer email address', example: 'billing@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'The customer phone number', example: '+1-555-0199' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'The customer website', example: 'https://acme.com' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ description: 'The customer tax ID / VAT number', example: 'US123456789' })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Billing address object' })
  @IsOptional()
  billingAddress?: any;

  @ApiPropertyOptional({ description: 'Shipping address object' })
  @IsOptional()
  shippingAddress?: any;

  @ApiPropertyOptional({ description: 'Default terms in days', example: 30 })
  @IsInt()
  @Min(0)
  @IsOptional()
  defaultTerms?: number;

  @ApiPropertyOptional({ description: 'Credit limit amount', example: 5000.00 })
  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Internal notes about the customer', example: 'VIP Customer' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether the customer is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GetCustomersFilterDto {
  @ApiPropertyOptional({ description: 'Search term for name or email', example: 'Acme' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active state', example: true })
  @IsOptional()
  isActive?: boolean;
}

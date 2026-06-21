import { IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaxCodeType {
  OUTPUT = 'OUTPUT',
  INPUT = 'INPUT',
  NONE = 'NONE',
}

export class CreateTaxCodeDto {
  @ApiProperty({ description: 'The name of the tax code', example: 'Standard VAT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'The unique tax code identifier', example: 'VAT-20' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @ApiProperty({ description: 'The tax rate as a decimal (e.g. 0.2000 for 20%)', example: 0.2 })
  @IsNumber()
  @IsNotEmpty()
  rate: number;

  @ApiProperty({ description: 'The type of tax code', enum: TaxCodeType, example: TaxCodeType.OUTPUT })
  @IsEnum(TaxCodeType)
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Optional description of the tax code', example: 'Standard 20% sales tax' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

export class UpdateTaxCodeDto {
  @ApiPropertyOptional({ description: 'The name of the tax code', example: 'Standard VAT' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'The tax rate as a decimal (e.g. 0.2000 for 20%)', example: 0.2 })
  @IsNumber()
  @IsOptional()
  rate?: number;

  @ApiPropertyOptional({ description: 'The type of tax code', enum: TaxCodeType, example: TaxCodeType.OUTPUT })
  @IsEnum(TaxCodeType)
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Optional description of the tax code', example: 'Standard 20% sales tax' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the tax code is active', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsInt,
  Min,
  ValidateNested,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Bank Account ─────────────────────────────────────────

export class CreateBankAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'GL account ID (must be CASH_AND_BANK subType)' })
  @IsUUID()
  glAccountId: string;
}

// ── Bank Transaction Filters ─────────────────────────────

export class BankTransactionFilterDto {
  @ApiPropertyOptional({ enum: ['IMPORTED', 'CATEGORIZED', 'MATCHED', 'RECONCILED', 'EXCLUDED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 50;
}

// ── Categorize ───────────────────────────────────────────

export class CategorizeTransactionDto {
  @ApiProperty({ description: 'GL account to categorize into' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

// ── Match ────────────────────────────────────────────────

export class MatchTransactionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorPaymentId?: string;
}

// ── Bank Rules ───────────────────────────────────────────

export class BankRuleConditionDto {
  @ApiProperty({ enum: ['payee', 'description', 'amount'] })
  @IsString()
  field: string;

  @ApiProperty({ enum: ['contains', 'equals', 'startsWith', 'endsWith', 'greaterThan', 'lessThan'] })
  @IsString()
  operator: string;

  @ApiProperty()
  @IsString()
  value: string;
}

export class CreateBankRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [BankRuleConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankRuleConditionDto)
  conditions: BankRuleConditionDto[];

  @ApiProperty({ description: 'GL account to auto-categorize into' })
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;
}

export class UpdateBankRuleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: [BankRuleConditionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BankRuleConditionDto)
  conditions?: BankRuleConditionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxCodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

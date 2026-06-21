import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  IsInt,
  Min,
  Max,
  Matches,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Account Types (mirrored from shared enums for DTO validation) ──

enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

enum AccountSubTypeEnum {
  CASH_AND_BANK = 'CASH_AND_BANK',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  CURRENT_ASSET = 'CURRENT_ASSET',
  INVENTORY = 'INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  OTHER_ASSET = 'OTHER_ASSET',
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER_LIABILITY = 'OTHER_LIABILITY',
  OWNERS_EQUITY = 'OWNERS_EQUITY',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  OPENING_BALANCE = 'OPENING_BALANCE',
  OTHER_EQUITY = 'OTHER_EQUITY',
  SALES_REVENUE = 'SALES_REVENUE',
  OTHER_INCOME = 'OTHER_INCOME',
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  PAYROLL_EXPENSE = 'PAYROLL_EXPENSE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

enum NormalBalanceEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

// ── Account DTOs ──────────────────────────────────────────

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  @Matches(/^[A-Za-z0-9\-]+$/, { message: 'Account code must be alphanumeric (dashes allowed)' })
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsEnum(AccountTypeEnum)
  type: string;

  @IsEnum(AccountSubTypeEnum)
  subType: string;

  @IsEnum(NormalBalanceEnum)
  normalBalance: string;

  @IsOptional()
  @IsBoolean()
  isContra?: boolean;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GetAccountsQueryDto {
  @IsOptional()
  @IsEnum(AccountTypeEnum)
  type?: string;

  @IsOptional()
  @IsEnum(AccountSubTypeEnum)
  subType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  tree?: boolean;
}

// ── Journal DTOs ──────────────────────────────────────────

export class JournalLineDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, { message: 'Debit must be a decimal string (e.g., "1500.0000")' })
  debit?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, { message: 'Credit must be a decimal string (e.g., "1500.0000")' })
  credit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  classTag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationTag?: string;
}

export class CreateJournalDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  memo?: string;

  @IsArray()
  @ArrayMinSize(2, { message: 'Journal entry must have at least 2 lines' })
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

export class GetJournalsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;
}

export class GetTrialBalanceQueryDto {
  @IsDateString()
  asOfDate: string;
}

export class GetGeneralLedgerQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

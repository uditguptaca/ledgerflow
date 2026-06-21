import {
  IsString,
  IsUUID,
  IsDateString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VendorPaymentAllocationDto {
  @IsUUID()
  billId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount: number;
}

export class CreateVendorPaymentDto {
  @IsUUID()
  vendorId: string;

  @IsUUID()
  bankAccountId: string;

  @IsDateString()
  date: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorPaymentAllocationDto)
  allocations: VendorPaymentAllocationDto[];
}

export class VendorPaymentFilterDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}

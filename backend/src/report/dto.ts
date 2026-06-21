import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AsOfDateQueryDto {
  @ApiProperty({ description: 'As-of date for point-in-time reports' })
  @IsDateString()
  asOfDate: string;
}

export class DateRangeQueryDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}

export class GeneralLedgerQueryDto {
  @ApiPropertyOptional({ description: 'Optional account filter. If omitted, returns ledger for all accounts.' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}

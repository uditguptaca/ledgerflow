import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StartReconciliationDto {
  @ApiProperty({ description: 'Bank account to reconcile' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({ description: 'Statement closing date' })
  @IsDateString()
  statementDate: string;

  @ApiProperty({ description: 'Statement ending balance (as string for precision)' })
  @IsNotEmpty()
  statementEndBalance: string;
}

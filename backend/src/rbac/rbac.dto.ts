import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const COMPANY_ROLES = [
  'COMPANY_ADMIN',
  'ACCOUNTANT',
  'BOOKKEEPER',
  'APPROVER',
  'EMPLOYEE',
  'READ_ONLY_AUDITOR',
] as const;

export class AddCompanyUserDto {
  @ApiProperty({ description: 'User ID to add to the company' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Role within the company',
    enum: COMPANY_ROLES,
  })
  @IsString()
  @IsIn(COMPANY_ROLES)
  role: string;
}

export class UpdateCompanyUserDto {
  @ApiPropertyOptional({
    description: 'Role within the company',
    enum: COMPANY_ROLES,
  })
  @IsOptional()
  @IsString()
  @IsIn(COMPANY_ROLES)
  role?: string;

  @ApiPropertyOptional({
    description: 'Permission overrides object with "add" and "remove" arrays',
    example: { add: ['reports.export'], remove: ['expenses.approve'] },
  })
  @IsOptional()
  permissionOverrides?: { add?: string[]; remove?: string[] };
}

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({ example: 'My Workspace' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;
}

export class CompanyAccessDto {
  @ApiProperty({ description: 'Company ID to grant access to' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({
    description: 'Role within the company',
    enum: ['COMPANY_ADMIN', 'ACCOUNTANT', 'BOOKKEEPER', 'APPROVER', 'EMPLOYEE', 'READ_ONLY_AUDITOR'],
  })
  @IsString()
  @IsIn(['COMPANY_ADMIN', 'ACCOUNTANT', 'BOOKKEEPER', 'APPROVER', 'EMPLOYEE', 'READ_ONLY_AUDITOR'])
  role: string;
}

export class CreateInvitationDto {
  @ApiProperty({ example: 'newuser@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Workspace-level role',
    enum: ['ADMIN', 'FIRM_MANAGER', 'MEMBER'],
    default: 'MEMBER',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'FIRM_MANAGER', 'MEMBER'])
  workspaceRole?: string = 'MEMBER';

  @ApiPropertyOptional({
    description: 'Array of company access entries',
    type: [CompanyAccessDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyAccessDto)
  companyAccess?: CompanyAccessDto[];
}

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Invitation token from email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ description: 'First name (required for new users)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name (required for new users)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Password (required for new users)' })
  @IsOptional()
  @IsString()
  password?: string;
}

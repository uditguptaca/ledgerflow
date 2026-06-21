import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { AddCompanyUserDto, UpdateCompanyUserDto } from './rbac.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('RBAC & User Access')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('roles')
  @ApiOperation({ summary: 'Get default roles and their associated permission lists' })
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  @ApiOperation({ summary: 'Get list of all permission strings available in the system' })
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('users.view')
  @Get('company-users')
  @ApiOperation({ summary: 'List all users assigned to the company' })
  async getCompanyUsers(@CurrentCompany('id') companyId: string) {
    return this.rbacService.getCompanyUsers(companyId);
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('users.manage')
  @Post('company-users')
  @ApiOperation({ summary: 'Add a workspace user to the company' })
  async addCompanyUser(
    @CurrentCompany('id') companyId: string,
    @Body() dto: AddCompanyUserDto,
  ) {
    return this.rbacService.addCompanyUser(companyId, dto);
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('users.manage')
  @Patch('company-users/:id')
  @ApiOperation({ summary: 'Update a user role or permission overrides within the company' })
  async updateCompanyUser(
    @CurrentCompany('id') companyId: string,
    @Param('id') companyUserId: string,
    @Body() dto: UpdateCompanyUserDto,
  ) {
    return this.rbacService.updateCompanyUser(companyId, companyUserId, dto);
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('users.manage')
  @Delete('company-users/:id')
  @ApiOperation({ summary: 'Remove a user from the company' })
  async removeCompanyUser(
    @CurrentCompany('id') companyId: string,
    @Param('id') companyUserId: string,
  ) {
    return this.rbacService.removeCompanyUser(companyId, companyUserId);
  }
}

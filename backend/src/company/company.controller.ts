import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto, UpdateCompanyDto } from './company.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, RequirePermissions } from '../common/decorators';

@ApiTags('Companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create a new company under a workspace (OWNER or ADMIN only)' })
  async createCompany(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companyService.createCompany(workspaceId, userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List companies the user has access to within a workspace' })
  async getCompanies(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyService.getCompanies(workspaceId, userId);
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: false, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard)
  @Get(':companyId')
  @ApiOperation({ summary: 'Get details of a specific company' })
  async getCompany(@Param('companyId') companyId: string) {
    return this.companyService.getCompany(companyId);
  }

  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Company-Id', required: true, description: 'Company Context ID' })
  @UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
  @RequirePermissions('company.settings')
  @Patch(':companyId')
  @ApiOperation({ summary: 'Update company settings and metadata' })
  async updateCompany(
    @Param('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateCompany(companyId, userId, dto);
  }
}

import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { RequirePermissions, CurrentCompany } from '../common/decorators';
import { TaxService } from './tax.service';
import { CreateTaxCodeDto, UpdateTaxCodeDto } from './tax.dto';

@ApiTags('Tax')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Active company context ID', required: true })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @ApiOperation({ summary: 'Retrieve all tax codes for the company' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved tax codes' })
  @RequirePermissions('accounts.view')
  @Get('codes')
  async getTaxCodes(@CurrentCompany('id') companyId: string) {
    return this.taxService.getTaxCodes(companyId);
  }

  @ApiOperation({ summary: 'Create a new tax code' })
  @ApiResponse({ status: 201, description: 'Tax code successfully created' })
  @RequirePermissions('accounts.create')
  @Post('codes')
  async createTaxCode(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateTaxCodeDto,
  ) {
    return this.taxService.createTaxCode(companyId, dto);
  }

  @ApiOperation({ summary: 'Update an existing tax code' })
  @ApiResponse({ status: 200, description: 'Tax code successfully updated' })
  @RequirePermissions('accounts.edit')
  @Patch('codes/:id')
  async updateTaxCode(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaxCodeDto,
  ) {
    return this.taxService.updateTaxCode(companyId, id, dto);
  }
}

import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { RequirePermissions, CurrentCompany } from '../common/decorators';
import { VendorService } from './vendor.service';
import { CreateVendorDto, UpdateVendorDto, GetVendorsFilterDto } from './vendor.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Active company context ID', required: true })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @ApiOperation({ summary: 'Retrieve vendors with optional filters' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved vendors list' })
  @RequirePermissions('vendors.view')
  @Get()
  async getVendors(
    @CurrentCompany('id') companyId: string,
    @Query() filters: GetVendorsFilterDto,
  ) {
    return this.vendorService.getVendors(companyId, filters);
  }

  @ApiOperation({ summary: 'Retrieve a vendor by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved vendor' })
  @RequirePermissions('vendors.view')
  @Get(':id')
  async getVendor(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.vendorService.getVendor(companyId, id);
  }

  @ApiOperation({ summary: 'Retrieve vendor balance' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved vendor Accounts Payable balance' })
  @RequirePermissions('vendors.view')
  @Get(':id/balance')
  async getVendorBalance(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    const balance = await this.vendorService.getVendorBalance(companyId, id);
    return { balance: balance.toFixed(4) };
  }

  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor successfully created' })
  @RequirePermissions('vendors.create')
  @Post()
  async createVendor(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateVendorDto,
  ) {
    return this.vendorService.createVendor(companyId, dto);
  }

  @ApiOperation({ summary: 'Update an existing vendor' })
  @ApiResponse({ status: 200, description: 'Vendor successfully updated' })
  @RequirePermissions('vendors.edit')
  @Patch(':id')
  async updateVendor(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorService.updateVendor(companyId, id, dto);
  }
}

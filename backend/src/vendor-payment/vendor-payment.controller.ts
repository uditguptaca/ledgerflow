import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { VendorPaymentService } from './vendor-payment.service';
import { CreateVendorPaymentDto, VendorPaymentFilterDto } from './vendor-payment.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Vendor Payments')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-company-id',
  description: 'The active company ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('vendor-payments')
export class VendorPaymentController {
  constructor(private readonly vendorPaymentService: VendorPaymentService) {}

  @Post()
  @RequirePermissions('vendor_payments.create')
  @ApiOperation({ summary: 'Create a vendor payment, allocate it against bills, and post journal' })
  @ApiResponse({ status: 201, description: 'Vendor payment successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input, mismatched allocation amount, or bill status constraint.' })
  @ApiResponse({ status: 404, description: 'Vendor, bank account, or bill not found.' })
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVendorPaymentDto,
  ) {
    return this.vendorPaymentService.createVendorPayment(companyId, userId, dto);
  }

  @Get()
  @RequirePermissions('vendor_payments.view')
  @ApiOperation({ summary: 'Retrieve a paginated list of vendor payments with optional filters' })
  @ApiResponse({ status: 200, description: 'List of vendor payments successfully retrieved.' })
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() filters: VendorPaymentFilterDto,
  ) {
    return this.vendorPaymentService.getVendorPayments(companyId, filters);
  }

  @Get(':id')
  @RequirePermissions('vendor_payments.view')
  @ApiOperation({ summary: 'Retrieve a single vendor payment with full details including allocations' })
  @ApiResponse({ status: 200, description: 'Vendor payment successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Vendor payment not found.' })
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorPaymentService.getVendorPayment(companyId, id);
  }

  @Post(':id/void')
  @RequirePermissions('vendor_payments.void')
  @ApiOperation({ summary: 'Void a vendor payment, reverse allocations, and post reversing journal' })
  @ApiResponse({ status: 200, description: 'Vendor payment successfully voided.' })
  @ApiResponse({ status: 400, description: 'Vendor payment already voided.' })
  @ApiResponse({ status: 404, description: 'Vendor payment not found.' })
  async void(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vendorPaymentService.voidVendorPayment(companyId, id, userId);
  }
}

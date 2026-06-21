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
import { PaymentService } from './payment.service';
import { CreatePaymentDto, PaymentFilterDto } from './payment.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Payments')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-company-id',
  description: 'The active company ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @RequirePermissions('payments.create')
  @ApiOperation({ summary: 'Create a customer payment, allocate it against invoices, and post journal' })
  @ApiResponse({ status: 201, description: 'Payment successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input, mismatched allocation amount, or invoice status constraint.' })
  @ApiResponse({ status: 404, description: 'Customer, bank account, or invoice not found.' })
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.createPayment(companyId, userId, dto);
  }

  @Get()
  @RequirePermissions('payments.view')
  @ApiOperation({ summary: 'Retrieve a paginated list of payments with optional filters' })
  @ApiResponse({ status: 200, description: 'List of payments successfully retrieved.' })
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() filters: PaymentFilterDto,
  ) {
    return this.paymentService.getPayments(companyId, filters);
  }

  @Get(':id')
  @RequirePermissions('payments.view')
  @ApiOperation({ summary: 'Retrieve a single payment with full details including allocations' })
  @ApiResponse({ status: 200, description: 'Payment successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentService.getPayment(companyId, id);
  }

  @Post(':id/void')
  @RequirePermissions('payments.void')
  @ApiOperation({ summary: 'Void a customer payment, reverse allocations, and post reversing journal' })
  @ApiResponse({ status: 200, description: 'Payment successfully voided.' })
  @ApiResponse({ status: 400, description: 'Payment already voided.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async void(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentService.voidPayment(companyId, id, userId);
  }
}

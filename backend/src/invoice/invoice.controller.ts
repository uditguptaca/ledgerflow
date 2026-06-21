import {
  Controller,
  Get,
  Post,
  Patch,
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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilterDto } from './invoice.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Invoices')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-company-id',
  description: 'The active company ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermissions('invoices.create')
  @ApiOperation({ summary: 'Create a new invoice in DRAFT status' })
  @ApiResponse({ status: 201, description: 'Invoice draft successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error.' })
  @ApiResponse({ status: 404, description: 'Customer or account not found.' })
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createInvoice(companyId, userId, dto);
  }

  @Get()
  @RequirePermissions('invoices.view')
  @ApiOperation({ summary: 'Retrieve a paginated list of invoices with optional filters' })
  @ApiResponse({ status: 200, description: 'List of invoices successfully retrieved.' })
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() filters: InvoiceFilterDto,
  ) {
    return this.invoiceService.getInvoices(companyId, filters);
  }

  @Get(':id')
  @RequirePermissions('invoices.view')
  @ApiOperation({ summary: 'Retrieve a single invoice with all details' })
  @ApiResponse({ status: 200, description: 'Invoice successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invoiceService.getInvoice(companyId, id);
  }

  @Patch(':id')
  @RequirePermissions('invoices.edit')
  @ApiOperation({ summary: 'Update a draft invoice' })
  @ApiResponse({ status: 200, description: 'Invoice successfully updated.' })
  @ApiResponse({ status: 400, description: 'Only DRAFT invoices can be updated.' })
  @ApiResponse({ status: 404, description: 'Invoice, customer, or account not found.' })
  async update(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.updateInvoice(companyId, id, userId, dto);
  }

  @Post(':id/post')
  @RequirePermissions('invoices.send')
  @ApiOperation({ summary: 'Post a draft invoice and create its double-entry journal entry' })
  @ApiResponse({ status: 200, description: 'Invoice successfully posted.' })
  @ApiResponse({ status: 400, description: 'Only DRAFT invoices can be posted.' })
  @ApiResponse({ status: 404, description: 'Invoice or system account not found.' })
  async postInvoice(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoiceService.postInvoice(companyId, id, userId);
  }

  @Post(':id/void')
  @RequirePermissions('invoices.void')
  @ApiOperation({ summary: 'Void a posted invoice and reverse its journal entry' })
  @ApiResponse({ status: 200, description: 'Invoice successfully voided.' })
  @ApiResponse({ status: 400, description: 'Only SENT or OVERDUE invoices can be voided.' })
  @ApiResponse({ status: 409, description: 'Cannot void invoice with allocated payments.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  async voidInvoice(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.invoiceService.voidInvoice(companyId, id, userId);
  }
}

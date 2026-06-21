import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { RequirePermissions, CurrentCompany } from '../common/decorators';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomersFilterDto } from './customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Active company context ID', required: true })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Retrieve customers with optional filters' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved customers list' })
  @RequirePermissions('customers.view')
  @Get()
  async getCustomers(
    @CurrentCompany('id') companyId: string,
    @Query() filters: GetCustomersFilterDto,
  ) {
    return this.customerService.getCustomers(companyId, filters);
  }

  @ApiOperation({ summary: 'Retrieve a customer by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved customer' })
  @RequirePermissions('customers.view')
  @Get(':id')
  async getCustomer(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.customerService.getCustomer(companyId, id);
  }

  @ApiOperation({ summary: 'Retrieve customer balance' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved customer Accounts Receivable balance' })
  @RequirePermissions('customers.view')
  @Get(':id/balance')
  async getCustomerBalance(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    const balance = await this.customerService.getCustomerBalance(companyId, id);
    return { balance: balance.toFixed(4) };
  }

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer successfully created' })
  @RequirePermissions('customers.create')
  @Post()
  async createCustomer(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customerService.createCustomer(companyId, dto);
  }

  @ApiOperation({ summary: 'Update an existing customer' })
  @ApiResponse({ status: 200, description: 'Customer successfully updated' })
  @RequirePermissions('customers.edit')
  @Patch(':id')
  async updateCustomer(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(companyId, id, dto);
  }

  @ApiOperation({ summary: 'Delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer successfully deleted' })
  @RequirePermissions('customers.delete')
  @Delete(':id')
  async deleteCustomer(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.customerService.deleteCustomer(companyId, id);
  }
}


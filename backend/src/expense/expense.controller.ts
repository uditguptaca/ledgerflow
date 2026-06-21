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
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, ExpenseFilterDto } from './expense.dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentUser, CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Expenses')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-company-id',
  description: 'The active company ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermissions('expenses.create')
  @ApiOperation({ summary: 'Create a new expense, post journal entry, and update bank balance' })
  @ApiResponse({ status: 201, description: 'Expense successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or validation error.' })
  @ApiResponse({ status: 404, description: 'Expense account, vendor, or bank account not found.' })
  async create(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenseService.createExpense(companyId, userId, dto);
  }

  @Get()
  @RequirePermissions('expenses.view')
  @ApiOperation({ summary: 'Retrieve a paginated list of expenses with optional filters' })
  @ApiResponse({ status: 200, description: 'List of expenses successfully retrieved.' })
  async findAll(
    @CurrentCompany('id') companyId: string,
    @Query() filters: ExpenseFilterDto,
  ) {
    return this.expenseService.getExpenses(companyId, filters);
  }

  @Get(':id')
  @RequirePermissions('expenses.view')
  @ApiOperation({ summary: 'Retrieve a single expense with full details' })
  @ApiResponse({ status: 200, description: 'Expense successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async findOne(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expenseService.getExpense(companyId, id);
  }

  @Post(':id/void')
  @RequirePermissions('expenses.approve')
  @ApiOperation({ summary: 'Void an expense and reverse its journal entry' })
  @ApiResponse({ status: 200, description: 'Expense successfully voided.' })
  @ApiResponse({ status: 400, description: 'Expense is already voided or has no journal entry.' })
  @ApiResponse({ status: 404, description: 'Expense not found.' })
  async void(
    @CurrentCompany('id') companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.expenseService.voidExpense(companyId, id, userId);
  }
}

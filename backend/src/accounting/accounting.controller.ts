import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { RequirePermissions, CurrentCompany, CurrentUser } from '../common/decorators';
import { AccountService } from './account.service';
import { PostingService } from './posting.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  GetAccountsQueryDto,
  CreateJournalDto,
  GetJournalsQueryDto,
} from './accounting.dto';

@ApiTags('Accounting')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', description: 'Active company context ID', required: true })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountService: AccountService,
    private readonly postingService: PostingService,
  ) {}

  // ── Account Endpoints ──────────────────────────────────────

  @ApiOperation({ summary: 'List accounts for the company' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved accounts' })
  @RequirePermissions('accounts.view')
  @Get('accounts')
  async getAccounts(
    @CurrentCompany('id') companyId: string,
    @Query() query: GetAccountsQueryDto,
  ) {
    const filters: GetAccountsQueryDto = {
      ...query,
      isActive: query.isActive !== undefined ? String(query.isActive) === 'true' : undefined,
      tree: query.tree !== undefined ? String(query.tree) === 'true' : undefined,
    };
    return this.accountService.getAccounts(companyId, filters);
  }

  @ApiOperation({ summary: 'Get a system account by system tag' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved system account' })
  @RequirePermissions('accounts.view')
  @Get('accounts/system/:tag')
  async getSystemAccount(
    @CurrentCompany('id') companyId: string,
    @Param('tag') tag: string,
  ) {
    return this.accountService.getSystemAccount(companyId, tag);
  }

  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved account' })
  @RequirePermissions('accounts.view')
  @Get('accounts/:id')
  async getAccount(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.accountService.getAccount(companyId, id);
  }

  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account successfully created' })
  @RequirePermissions('accounts.create')
  @Post('accounts')
  async createAccount(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountService.createAccount(companyId, dto);
  }

  @ApiOperation({ summary: 'Update an existing account' })
  @ApiResponse({ status: 200, description: 'Account successfully updated' })
  @RequirePermissions('accounts.edit')
  @Patch('accounts/:id')
  async updateAccount(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.updateAccount(companyId, id, dto);
  }

  // ── Journal Entry Endpoints ────────────────────────────────

  @ApiOperation({ summary: 'List journal entries with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved journal entries' })
  @RequirePermissions('journals.view')
  @Get('journals')
  async getJournals(
    @CurrentCompany('id') companyId: string,
    @Query() query: GetJournalsQueryDto,
  ) {
    const filters = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      sourceType: query.sourceType,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    };
    return this.postingService.getJournals(companyId, filters);
  }

  @ApiOperation({ summary: 'Get a single journal entry by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved journal entry' })
  @RequirePermissions('journals.view')
  @Get('journals/:id')
  async getJournal(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.postingService.getJournal(companyId, id);
  }

  @ApiOperation({ summary: 'Post a new manual journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry successfully posted' })
  @RequirePermissions('journals.post')
  @Post('journals')
  async postJournal(
    @CurrentCompany('id') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJournalDto,
  ) {
    return this.postingService.postJournal({
      companyId,
      date: new Date(dto.date),
      memo: dto.memo,
      sourceType: 'MANUAL',
      lines: dto.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
        customerId: line.customerId,
        vendorId: line.vendorId,
        projectId: line.projectId,
        classTag: line.classTag,
        locationTag: line.locationTag,
      })),
      createdBy: userId,
    });
  }

  @ApiOperation({ summary: 'Void a posted journal entry (creates reversal entry)' })
  @ApiResponse({ status: 200, description: 'Journal entry successfully voided' })
  @RequirePermissions('journals.void')
  @Post('journals/:id/void')
  async voidJournal(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.postingService.voidJournal(id, userId);
  }
}

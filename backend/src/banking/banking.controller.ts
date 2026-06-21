import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { BankingService } from './banking.service';
import {
  CreateBankAccountDto,
  BankTransactionFilterDto,
  CategorizeTransactionDto,
  MatchTransactionDto,
  CreateBankRuleDto,
  UpdateBankRuleDto,
} from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, CurrentUser, RequirePermissions } from '../common/decorators';

@ApiTags('Banking')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  // ─── Bank Accounts ──────────────────────────────────────

  @Post('accounts')
  @RequirePermissions('bank_accounts.manage')
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({ status: 201, description: 'Bank account created successfully.' })
  async createBankAccount(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankingService.createBankAccount(companyId, dto);
  }

  @Get('accounts')
  @RequirePermissions('banking.view')
  @ApiOperation({ summary: 'List all bank accounts' })
  @ApiResponse({ status: 200, description: 'List of bank accounts.' })
  async getBankAccounts(@CurrentCompany('id') companyId: string) {
    return this.bankingService.getBankAccounts(companyId);
  }

  @Get('accounts/:id')
  @RequirePermissions('banking.view')
  @ApiOperation({ summary: 'Get details of a bank account' })
  @ApiResponse({ status: 200, description: 'Bank account details.' })
  async getBankAccount(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.bankingService.getBankAccount(companyId, id);
  }

  // ─── Import & Transactions ────────────────────────────────

  @Post('accounts/:id/import')
  @RequirePermissions('banking.import')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import bank transactions via CSV file' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing bank transactions (date, description, amount columns)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importTransactions(
    @CurrentCompany('id') companyId: string,
    @Param('id') bankAccountId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No CSV file uploaded');
    }
    const csvData = file.buffer.toString('utf-8');
    return this.bankingService.importBankTransactions(companyId, bankAccountId, csvData);
  }

  @Get('accounts/:id/transactions')
  @RequirePermissions('banking.view')
  @ApiOperation({ summary: 'Get bank transactions for an account' })
  async getBankTransactions(
    @CurrentCompany('id') companyId: string,
    @Param('id') bankAccountId: string,
    @Query() filters: BankTransactionFilterDto,
  ) {
    return this.bankingService.getBankTransactions(companyId, bankAccountId, filters);
  }

  @Post('transactions/:id/categorize')
  @RequirePermissions('banking.categorize')
  @ApiOperation({ summary: 'Categorize a bank transaction' })
  async categorizeTransaction(
    @CurrentCompany('id') companyId: string,
    @Param('id') transactionId: string,
    @Body() dto: CategorizeTransactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bankingService.categorizeTransaction(companyId, transactionId, dto, userId);
  }

  @Post('transactions/:id/match')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Match a bank transaction to an existing document' })
  async matchTransaction(
    @CurrentCompany('id') companyId: string,
    @Param('id') transactionId: string,
    @Body() dto: MatchTransactionDto,
  ) {
    return this.bankingService.matchTransaction(companyId, transactionId, dto);
  }

  @Post('accounts/:id/auto-match')
  @RequirePermissions('banking.reconcile')
  @ApiOperation({ summary: 'Suggest auto-matches for imported transactions' })
  async autoMatchTransactions(
    @CurrentCompany('id') companyId: string,
    @Param('id') bankAccountId: string,
  ) {
    return this.bankingService.autoMatchTransactions(companyId, bankAccountId);
  }

  @Post('accounts/:id/apply-rules')
  @RequirePermissions('banking.categorize')
  @ApiOperation({ summary: 'Apply active bank rules to imported transactions' })
  async applyBankRules(
    @CurrentCompany('id') companyId: string,
    @Param('id') bankAccountId: string,
  ) {
    return this.bankingService.applyBankRules(companyId, bankAccountId);
  }

  // ─── Rules CRUD ───────────────────────────────────────────

  @Post('rules')
  @RequirePermissions('bank_accounts.manage')
  @ApiOperation({ summary: 'Create a new bank rule' })
  async createBankRule(
    @CurrentCompany('id') companyId: string,
    @Body() dto: CreateBankRuleDto,
  ) {
    return this.bankingService.createBankRule(companyId, dto);
  }

  @Get('rules')
  @RequirePermissions('banking.view')
  @ApiOperation({ summary: 'List all active bank rules' })
  async getBankRules(@CurrentCompany('id') companyId: string) {
    return this.bankingService.getBankRules(companyId);
  }

  @Patch('rules/:id')
  @RequirePermissions('bank_accounts.manage')
  @ApiOperation({ summary: 'Update an existing bank rule' })
  async updateBankRule(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBankRuleDto,
  ) {
    return this.bankingService.updateBankRule(companyId, id, dto);
  }

  @Delete('rules/:id')
  @RequirePermissions('bank_accounts.manage')
  @ApiOperation({ summary: 'Delete a bank rule' })
  async deleteBankRule(
    @CurrentCompany('id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.bankingService.deleteBankRule(companyId, id);
  }
}

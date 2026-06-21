import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { AsOfDateQueryDto, DateRangeQueryDto, GeneralLedgerQueryDto } from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('trial-balance')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Trial Balance report' })
  async getTrialBalance(
    @CurrentCompany('id') companyId: string,
    @Query() query: AsOfDateQueryDto,
  ) {
    const asOfDate = new Date(query.asOfDate);
    return this.reportService.getTrialBalance(companyId, asOfDate);
  }

  @Get('profit-loss')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Profit & Loss report' })
  async getProfitAndLoss(
    @CurrentCompany('id') companyId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.reportService.getProfitAndLoss(companyId, startDate, endDate);
  }

  @Get('balance-sheet')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Balance Sheet report' })
  async getBalanceSheet(
    @CurrentCompany('id') companyId: string,
    @Query() query: AsOfDateQueryDto,
  ) {
    const asOfDate = new Date(query.asOfDate);
    return this.reportService.getBalanceSheet(companyId, asOfDate);
  }

  @Get('cash-flow')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Cash Flow report' })
  async getCashFlow(
    @CurrentCompany('id') companyId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.reportService.getCashFlowStatement(companyId, startDate, endDate);
  }

  @Get('aged-receivables')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Aged Receivables report' })
  async getAgedReceivables(
    @CurrentCompany('id') companyId: string,
    @Query() query: AsOfDateQueryDto,
  ) {
    const asOfDate = new Date(query.asOfDate);
    return this.reportService.getAgedReceivables(companyId, asOfDate);
  }

  @Get('aged-payables')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Aged Payables report' })
  async getAgedPayables(
    @CurrentCompany('id') companyId: string,
    @Query() query: AsOfDateQueryDto,
  ) {
    const asOfDate = new Date(query.asOfDate);
    return this.reportService.getAgedPayables(companyId, asOfDate);
  }

  @Get('tax-summary')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get Tax Summary report' })
  async getTaxSummary(
    @CurrentCompany('id') companyId: string,
    @Query() query: DateRangeQueryDto,
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.reportService.getTaxSummary(companyId, startDate, endDate);
  }

  @Get('general-ledger')
  @RequirePermissions('reports.view')
  @ApiOperation({ summary: 'Get General Ledger report for an account' })
  async getGeneralLedger(
    @CurrentCompany('id') companyId: string,
    @Query() query: GeneralLedgerQueryDto,
  ) {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    return this.reportService.getGeneralLedger(
      companyId,
      query.accountId,
      startDate,
      endDate,
    );
  }
}

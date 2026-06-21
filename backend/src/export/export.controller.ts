import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
} from '@nestjs/swagger';
import { ReportService } from '../report/report.service';
import { ExportService, ExportColumn } from './export.service';
import { ExportQueryDto, ExportFormat } from './dto';
import { JwtAuthGuard, CompanyGuard, PermissionGuard } from '../common/guards';
import { CurrentCompany, RequirePermissions } from '../common/decorators';

@ApiTags('Export')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: true, description: 'Company context ID' })
@UseGuards(JwtAuthGuard, CompanyGuard, PermissionGuard)
@Controller('export')
export class ExportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly exportService: ExportService,
  ) {}

  @Get(':reportType')
  @RequirePermissions('reports.export')
  @ApiOperation({ summary: 'Export reports as CSV, XLSX, or HTML-PDF' })
  async exportReport(
    @CurrentCompany('id') companyId: string,
    @CurrentCompany('name') companyName: string,
    @Param('reportType') reportType: string,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    let reportData: any;
    let flatData: any[] = [];
    let columns: ExportColumn[] = [];
    let reportTitle = '';
    let dateRangeInfo: { start?: string; end?: string; asOf?: string } = {};

    // ─── 1. Retrieve and Flatten Report Data ─────────────────
    switch (reportType) {
      case 'trial-balance': {
        if (!query.asOfDate) {
          throw new BadRequestException('asOfDate is required for trial-balance');
        }
        const asOf = new Date(query.asOfDate);
        reportTitle = 'Trial Balance';
        dateRangeInfo = { asOf: query.asOfDate };
        reportData = await this.reportService.getTrialBalance(companyId, asOf);
        flatData = reportData.accounts;
        columns = [
          { key: 'accountCode', header: 'Account Code' },
          { key: 'accountName', header: 'Account Name' },
          { key: 'accountType', header: 'Type' },
          { key: 'debitTotal', header: 'Debit', isCurrency: true },
          { key: 'creditTotal', header: 'Credit', isCurrency: true },
          { key: 'balance', header: 'Net Balance', isCurrency: true },
        ];
        break;
      }

      case 'profit-loss': {
        if (!query.startDate || !query.endDate) {
          throw new BadRequestException('startDate and endDate are required for profit-loss');
        }
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        reportTitle = 'Profit & Loss';
        dateRangeInfo = { start: query.startDate, end: query.endDate };
        const pl = await this.reportService.getProfitAndLoss(companyId, start, end);

        // Flatten P&L
        const addPLSection = (sectionName: string, sectionObj: { accounts: any[]; total: string }) => {
          flatData.push({ section: sectionName, code: '', name: `-- ${sectionName} --`, balance: '' });
          sectionObj.accounts.forEach(acc => {
            flatData.push({
              section: sectionName,
              code: acc.accountCode,
              name: acc.accountName,
              balance: acc.balance,
            });
          });
          flatData.push({ section: sectionName, code: '', name: `Total ${sectionName}`, balance: sectionObj.total });
        };

        addPLSection('Sales Revenue', pl.income.salesRevenue);
        addPLSection('Service Revenue', pl.income.serviceRevenue);
        addPLSection('Other Income', pl.income.otherIncome);
        flatData.push({ section: 'Total Income', code: '', name: 'TOTAL INCOME', balance: pl.income.totalIncome });

        addPLSection('Cost of Goods Sold', pl.costOfGoodsSold);
        flatData.push({ section: 'Gross Profit', code: '', name: 'GROSS PROFIT', balance: pl.grossProfit });

        addPLSection('Operating Expenses', pl.operatingExpenses.operatingExpenses);
        addPLSection('Payroll Expenses', pl.operatingExpenses.payrollExpenses);
        addPLSection('Rent & Occupancy', pl.operatingExpenses.rentExpenses);
        addPLSection('Utilities', pl.operatingExpenses.utilityExpenses);
        addPLSection('Office Expenses', pl.operatingExpenses.officeExpenses);
        addPLSection('Depreciation', pl.operatingExpenses.depreciationExpense);
        addPLSection('Travel & Entertainment', pl.operatingExpenses.travelExpenses);
        flatData.push({
          section: 'Total Operating Expenses',
          code: '',
          name: 'TOTAL OPERATING EXPENSES',
          balance: pl.operatingExpenses.totalOperatingExpenses,
        });

        flatData.push({ section: 'Operating Profit', code: '', name: 'OPERATING PROFIT', balance: pl.operatingProfit });

        addPLSection('Other Expenses', pl.otherExpenses.otherExpenses);
        addPLSection('Interest Expense', pl.otherExpenses.interestExpense);
        addPLSection('Tax Expense', pl.otherExpenses.taxExpense);
        flatData.push({
          section: 'Total Other Expenses',
          code: '',
          name: 'TOTAL OTHER EXPENSES',
          balance: pl.otherExpenses.totalOtherExpenses,
        });

        flatData.push({ section: 'Net Profit', code: '', name: 'NET PROFIT', balance: pl.netProfit });

        columns = [
          { key: 'section', header: 'Section' },
          { key: 'code', header: 'Account Code' },
          { key: 'name', header: 'Account Name' },
          { key: 'balance', header: 'Amount', isCurrency: true },
        ];
        break;
      }

      case 'balance-sheet': {
        if (!query.asOfDate) {
          throw new BadRequestException('asOfDate is required for balance-sheet');
        }
        const asOf = new Date(query.asOfDate);
        reportTitle = 'Balance Sheet';
        dateRangeInfo = { asOf: query.asOfDate };
        const bs = await this.reportService.getBalanceSheet(companyId, asOf);

        // Flatten Balance Sheet
        const addBSSection = (sectionName: string, sectionObj: { accounts: any[]; total: string }) => {
          flatData.push({ type: '', section: sectionName, code: '', name: `-- ${sectionName} --`, balance: '' });
          sectionObj.accounts.forEach(acc => {
            flatData.push({
              type: acc.accountType,
              section: sectionName,
              code: acc.accountCode,
              name: acc.accountName,
              balance: acc.balance,
            });
          });
          flatData.push({ type: '', section: sectionName, code: '', name: `Total ${sectionName}`, balance: sectionObj.total });
        };

        flatData.push({ type: 'ASSETS', section: '', code: '', name: '=== ASSETS ===', balance: '' });
        addBSSection('Cash & Bank', bs.assets.cashAndBank);
        addBSSection('Accounts Receivable', bs.assets.accountsReceivable);
        addBSSection('Current Assets', bs.assets.currentAssets);
        addBSSection('Inventory', bs.assets.inventory);
        addBSSection('Fixed Assets', bs.assets.fixedAssets);
        addBSSection('Other Assets', bs.assets.otherAssets);
        addBSSection('Tax Receivable', bs.assets.taxReceivable);
        flatData.push({ type: '', section: '', code: '', name: 'TOTAL ASSETS', balance: bs.assets.totalAssets });

        flatData.push({ type: 'LIABILITIES', section: '', code: '', name: '=== LIABILITIES ===', balance: '' });
        addBSSection('Accounts Payable', bs.liabilities.accountsPayable);
        addBSSection('Current Liabilities', bs.liabilities.currentLiabilities);
        addBSSection('Long-term Liabilities', bs.liabilities.longTermLiabilities);
        addBSSection('Tax Payable', bs.liabilities.taxPayable);
        addBSSection('Other Liabilities', bs.liabilities.otherLiabilities);
        flatData.push({ type: '', section: '', code: '', name: 'TOTAL LIABILITIES', balance: bs.liabilities.totalLiabilities });

        flatData.push({ type: 'EQUITY', section: '', code: '', name: '=== EQUITY ===', balance: '' });
        addBSSection("Owner's Equity", bs.equity.ownersEquity);
        addBSSection('Retained Earnings', bs.equity.retainedEarnings);
        addBSSection('Other Equity', bs.equity.otherEquity);
        flatData.push({ type: '', section: '', code: '', name: 'Current Year Earnings', balance: bs.equity.currentYearEarnings });
        flatData.push({ type: '', section: '', code: '', name: 'TOTAL EQUITY', balance: bs.equity.totalEquity });

        flatData.push({ type: '', section: '', code: '', name: 'TOTAL LIABILITIES & EQUITY', balance: bs.totalLiabilitiesAndEquity });

        columns = [
          { key: 'type', header: 'Type' },
          { key: 'section', header: 'Section' },
          { key: 'code', header: 'Account Code' },
          { key: 'name', header: 'Account Name' },
          { key: 'balance', header: 'Balance', isCurrency: true },
        ];
        break;
      }

      case 'cash-flow': {
        if (!query.startDate || !query.endDate) {
          throw new BadRequestException('startDate and endDate are required for cash-flow');
        }
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        reportTitle = 'Cash Flow Statement';
        dateRangeInfo = { start: query.startDate, end: query.endDate };
        const cf = await this.reportService.getCashFlowStatement(companyId, start, end);

        // Flatten Cash Flow
        flatData.push({ section: 'Operating Activities', activity: 'Net Income', amount: cf.operatingActivities.netIncome });
        flatData.push({ section: 'Operating Activities', activity: 'Adjustments: Depreciation', amount: cf.operatingActivities.adjustments.depreciation });
        flatData.push({ section: 'Operating Activities', activity: 'Adjustments: Accounts Receivable', amount: cf.operatingActivities.adjustments.accountsReceivable });
        flatData.push({ section: 'Operating Activities', activity: 'Adjustments: Accounts Payable', amount: cf.operatingActivities.adjustments.accountsPayable });
        flatData.push({ section: 'Operating Activities', activity: 'Adjustments: Inventory', amount: cf.operatingActivities.adjustments.inventory });
        flatData.push({ section: 'Operating Activities', activity: 'Total Operating Cash Flow', amount: cf.operatingActivities.totalOperatingCashFlow });

        flatData.push({ section: 'Investing Activities', activity: 'Fixed Asset Purchases', amount: cf.investingActivities.fixedAssetPurchases });
        flatData.push({ section: 'Investing Activities', activity: 'Total Investing Cash Flow', amount: cf.investingActivities.totalInvestingCashFlow });

        flatData.push({ section: 'Financing Activities', activity: 'Equity Changes', amount: cf.financingActivities.equityChanges });
        flatData.push({ section: 'Financing Activities', activity: 'Retained Earnings Changes', amount: cf.financingActivities.retainedEarningsChanges });
        flatData.push({ section: 'Financing Activities', activity: 'Long-term Debt Changes', amount: cf.financingActivities.longTermDebtChanges });
        flatData.push({ section: 'Financing Activities', activity: 'Total Financing Cash Flow', amount: cf.financingActivities.totalFinancingCashFlow });

        flatData.push({ section: 'Net Change in Cash', activity: 'NET CHANGE IN CASH', amount: cf.netChangeInCash });
        flatData.push({ section: 'Cash Balances', activity: 'Beginning Cash Balance', amount: cf.beginningCashBalance });
        flatData.push({ section: 'Cash Balances', activity: 'Ending Cash Balance', amount: cf.endingCashBalance });

        columns = [
          { key: 'section', header: 'Section' },
          { key: 'activity', header: 'Activity/Item' },
          { key: 'amount', header: 'Amount', isCurrency: true },
        ];
        break;
      }

      case 'aged-receivables': {
        if (!query.asOfDate) {
          throw new BadRequestException('asOfDate is required for aged-receivables');
        }
        const asOf = new Date(query.asOfDate);
        reportTitle = 'Aged Receivables';
        dateRangeInfo = { asOf: query.asOfDate };
        const ar = await this.reportService.getAgedReceivables(companyId, asOf);

        // Flatten Aged Receivables
        ar.customers.forEach(cust => {
          cust.invoices.forEach(inv => {
            flatData.push({
              customerName: cust.customerName,
              invoiceNumber: inv.invoiceNumber,
              invoiceDate: inv.invoiceDate,
              dueDate: inv.dueDate,
              daysOverdue: inv.daysOverdue,
              current: inv.bucket === 'current' ? inv.amountDue : '0',
              days1to30: inv.bucket === '1-30' ? inv.amountDue : '0',
              days31to60: inv.bucket === '31-60' ? inv.amountDue : '0',
              days61to90: inv.bucket === '61-90' ? inv.amountDue : '0',
              days90plus: inv.bucket === '90+' ? inv.amountDue : '0',
              total: inv.amountDue,
            });
          });
          flatData.push({
            customerName: `Total ${cust.customerName}`,
            invoiceNumber: '',
            invoiceDate: '',
            dueDate: '',
            daysOverdue: '',
            current: cust.current,
            days1to30: cust.days1to30,
            days31to60: cust.days31to60,
            days61to90: cust.days61to90,
            days90plus: cust.days90plus,
            total: cust.total,
          });
        });
        flatData.push({
          customerName: 'GRAND TOTAL',
          invoiceNumber: '',
          invoiceDate: '',
          dueDate: '',
          daysOverdue: '',
          current: ar.totals.current,
          days1to30: ar.totals.days1to30,
          days31to60: ar.totals.days31to60,
          days61to90: ar.totals.days61to90,
          days90plus: ar.totals.days90plus,
          total: ar.totals.total,
        });

        columns = [
          { key: 'customerName', header: 'Customer' },
          { key: 'invoiceNumber', header: 'Invoice Number' },
          { key: 'invoiceDate', header: 'Invoice Date' },
          { key: 'dueDate', header: 'Due Date' },
          { key: 'daysOverdue', header: 'Days Overdue' },
          { key: 'current', header: 'Current', isCurrency: true },
          { key: 'days1to30', header: '1-30 Days', isCurrency: true },
          { key: 'days31to60', header: '31-60 Days', isCurrency: true },
          { key: 'days61to90', header: '61-90 Days', isCurrency: true },
          { key: 'days90plus', header: '90+ Days', isCurrency: true },
          { key: 'total', header: 'Total Outstanding', isCurrency: true },
        ];
        break;
      }

      case 'aged-payables': {
        if (!query.asOfDate) {
          throw new BadRequestException('asOfDate is required for aged-payables');
        }
        const asOf = new Date(query.asOfDate);
        reportTitle = 'Aged Payables';
        dateRangeInfo = { asOf: query.asOfDate };
        const ap = await this.reportService.getAgedPayables(companyId, asOf);

        // Flatten Aged Payables
        ap.vendors.forEach(vend => {
          vend.bills.forEach(bill => {
            flatData.push({
              vendorName: vend.vendorName,
              billNumber: bill.billNumber,
              billDate: bill.billDate,
              dueDate: bill.dueDate,
              daysOverdue: bill.daysOverdue,
              current: bill.bucket === 'current' ? bill.amountDue : '0',
              days1to30: bill.bucket === '1-30' ? bill.amountDue : '0',
              days31to60: bill.bucket === '31-60' ? bill.amountDue : '0',
              days61to90: bill.bucket === '61-90' ? bill.amountDue : '0',
              days90plus: bill.bucket === '90+' ? bill.amountDue : '0',
              total: bill.amountDue,
            });
          });
          flatData.push({
            vendorName: `Total ${vend.vendorName}`,
            billNumber: '',
            billDate: '',
            dueDate: '',
            daysOverdue: '',
            current: vend.current,
            days1to30: vend.days1to30,
            days31to60: vend.days31to60,
            days61to90: vend.days61to90,
            days90plus: vend.days90plus,
            total: vend.total,
          });
        });
        flatData.push({
          vendorName: 'GRAND TOTAL',
          billNumber: '',
          billDate: '',
          dueDate: '',
          daysOverdue: '',
          current: ap.totals.current,
          days1to30: ap.totals.days1to30,
          days31to60: ap.totals.days31to60,
          days61to90: ap.totals.days61to90,
          days90plus: ap.totals.days90plus,
          total: ap.totals.total,
        });

        columns = [
          { key: 'vendorName', header: 'Vendor' },
          { key: 'billNumber', header: 'Bill Number' },
          { key: 'billDate', header: 'Bill Date' },
          { key: 'dueDate', header: 'Due Date' },
          { key: 'daysOverdue', header: 'Days Overdue' },
          { key: 'current', header: 'Current', isCurrency: true },
          { key: 'days1to30', header: '1-30 Days', isCurrency: true },
          { key: 'days31to60', header: '31-60 Days', isCurrency: true },
          { key: 'days61to90', header: '61-90 Days', isCurrency: true },
          { key: 'days90plus', header: '90+ Days', isCurrency: true },
          { key: 'total', header: 'Total Outstanding', isCurrency: true },
        ];
        break;
      }

      case 'tax-summary': {
        if (!query.startDate || !query.endDate) {
          throw new BadRequestException('startDate and endDate are required for tax-summary');
        }
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        reportTitle = 'Tax Summary';
        dateRangeInfo = { start: query.startDate, end: query.endDate };
        const ts = await this.reportService.getTaxSummary(companyId, start, end);

        // Flatten Tax Summary
        flatData = [
          { category: 'Output Tax (Sales Tax Payable - Credit Total)', amount: ts.outputTax },
          { category: 'Input Tax (Tax Receivable - Debit Total)', amount: ts.inputTax },
          { category: 'Net Tax Payable / (Refundable)', amount: ts.netTaxPayable },
        ];

        columns = [
          { key: 'category', header: 'Category' },
          { key: 'amount', header: 'Amount', isCurrency: true },
        ];
        break;
      }

      case 'general-ledger': {
        if (!query.accountId || !query.startDate || !query.endDate) {
          throw new BadRequestException('accountId, startDate and endDate are required for general-ledger');
        }
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        reportTitle = 'General Ledger';
        dateRangeInfo = { start: query.startDate, end: query.endDate };
        const gl: any = await this.reportService.getGeneralLedger(
          companyId,
          query.accountId,
          start,
          end,
        );

        // Flatten General Ledger
        flatData.push({
          journalNumber: 'OPENING',
          date: '',
          memo: 'Opening Balance',
          sourceType: '',
          description: '',
          debit: '0',
          credit: '0',
          balance: gl.openingBalance,
        });

        gl.lines.forEach((line: any) => {
          flatData.push({
            journalNumber: line.journalNumber,
            date: line.date,
            memo: line.memo,
            sourceType: line.sourceType,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
            balance: line.balance,
          });
        });

        flatData.push({
          journalNumber: 'CLOSING',
          date: '',
          memo: 'Closing Balance',
          sourceType: '',
          description: '',
          debit: '0',
          credit: '0',
          balance: gl.closingBalance,
        });

        columns = [
          { key: 'journalNumber', header: 'Journal Number' },
          { key: 'date', header: 'Date' },
          { key: 'memo', header: 'Memo' },
          { key: 'sourceType', header: 'Source Type' },
          { key: 'description', header: 'Description' },
          { key: 'debit', header: 'Debit', isCurrency: true },
          { key: 'credit', header: 'Credit', isCurrency: true },
          { key: 'balance', header: 'Running Balance', isCurrency: true },
        ];
        break;
      }

      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }

    // ─── 2. Format Response Based on Selected Format ─────────
    const format = query.format;
    const filename = `${reportType}_${new Date().toISOString().split('T')[0]}`;

    if (format === ExportFormat.CSV) {
      const buffer = await this.exportService.exportToCsv(flatData, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(buffer);
    } else if (format === ExportFormat.XLSX) {
      const buffer = await this.exportService.exportToXlsx(flatData, columns, reportTitle);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      res.send(buffer);
    } else if (format === ExportFormat.PDF) {
      // Serves the HTML ready for PDF generation/printing
      const buffer = await this.exportService.exportToPdf(
        reportTitle,
        companyName,
        flatData,
        columns,
        dateRangeInfo,
      );
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `inline; filename="${filename}.html"`);
      res.send(buffer);
    } else {
      throw new BadRequestException(`Unsupported format: ${format}`);
    }
  }
}

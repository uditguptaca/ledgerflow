import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from 'decimal.js';

/** Shape of an account row in report output */
export interface ReportAccountRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  accountSubType: string;
  isContra: boolean;
  debitTotal: string;
  creditTotal: string;
  balance: string;
}

/** P&L section */
export interface PLSection {
  label: string;
  accounts: ReportAccountRow[];
  total: string;
}

/** Aging bucket */
export interface AgingBucket {
  current: string;
  days1to30: string;
  days31to60: string;
  days61to90: string;
  days90plus: string;
  total: string;
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Trial Balance ──────────────────────────────────────

  /**
   * Generate a trial balance as of a given date.
   * Groups all journal lines by account, computes debit and credit totals.
   * Asserts totalDebits === totalCredits.
   */
  async getTrialBalance(companyId: string, asOfDate: Date) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        account_id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        account_sub_type: string;
        normal_balance: string;
        is_contra: boolean;
        total_debits: any;
        total_credits: any;
      }>
    >`
      SELECT
        a.id AS account_id,
        a.code AS account_code,
        a.name AS account_name,
        a.type AS account_type,
        a."subType" AS account_sub_type,
        a."normalBalance" AS normal_balance,
        a."isContra" AS is_contra,
        COALESCE(SUM(jl.debit), 0) AS total_debits,
        COALESCE(SUM(jl.credit), 0) AS total_credits
      FROM accounts a
      LEFT JOIN journal_lines jl ON jl."accountId" = a.id
      LEFT JOIN journal_entries je ON je.id = jl."journalEntryId"
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date <= ${asOfDate}
      WHERE a."companyId" = ${companyId}
        AND a."isActive" = true
      GROUP BY a.id, a.code, a.name, a.type, a."subType", a."normalBalance", a."isContra"
      HAVING COALESCE(SUM(jl.debit), 0) != 0 OR COALESCE(SUM(jl.credit), 0) != 0
      ORDER BY a.code
    `;

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    const accounts: ReportAccountRow[] = rows.map((row) => {
      const debits = new Decimal(row.total_debits?.toString() || '0');
      const credits = new Decimal(row.total_credits?.toString() || '0');
      totalDebits = totalDebits.plus(debits);
      totalCredits = totalCredits.plus(credits);

      // Net balance: for debit-normal accounts, balance = debits - credits (positive = debit)
      // For credit-normal accounts, balance = credits - debits (positive = credit)
      let balance: Decimal;
      if (row.normal_balance === 'DEBIT') {
        balance = debits.minus(credits);
      } else {
        balance = credits.minus(debits);
      }

      return {
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        accountType: row.account_type,
        accountSubType: row.account_sub_type,
        isContra: row.is_contra,
        debitTotal: debits.toFixed(4),
        creditTotal: credits.toFixed(4),
        balance: balance.toFixed(4),
      };
    });

    const isBalanced = totalDebits.equals(totalCredits);

    return {
      asOfDate: asOfDate.toISOString().split('T')[0],
      accounts,
      totalDebits: totalDebits.toFixed(4),
      totalCredits: totalCredits.toFixed(4),
      isBalanced,
    };
  }

  // ─── Profit & Loss ──────────────────────────────────────

  /**
   * Generate a Profit & Loss statement for a date range.
   * Computes Income, COGS, Gross Profit, Operating Expenses, and Net Profit.
   */
  async getProfitAndLoss(companyId: string, startDate: Date, endDate: Date) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        account_id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        account_sub_type: string;
        is_contra: boolean;
        normal_balance: string;
        total_debits: any;
        total_credits: any;
      }>
    >`
      SELECT
        a.id AS account_id,
        a.code AS account_code,
        a.name AS account_name,
        a.type AS account_type,
        a."subType" AS account_sub_type,
        a."isContra" AS is_contra,
        a."normalBalance" AS normal_balance,
        COALESCE(SUM(jl.debit), 0) AS total_debits,
        COALESCE(SUM(jl.credit), 0) AS total_credits
      FROM accounts a
      INNER JOIN journal_lines jl ON jl."accountId" = a.id
      INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
      WHERE a."companyId" = ${companyId}
        AND a.type IN ('INCOME', 'EXPENSE')
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
      GROUP BY a.id, a.code, a.name, a.type, a."subType", a."isContra", a."normalBalance"
      ORDER BY a.type, a."subType", a.code
    `;

    // Process rows
    const accountsBySubType: Record<string, ReportAccountRow[]> = {};

    for (const row of rows) {
      const debits = new Decimal(row.total_debits?.toString() || '0');
      const credits = new Decimal(row.total_credits?.toString() || '0');

      // Income: net = credits - debits (positive = income earned)
      // Expense: net = debits - credits (positive = expense incurred)
      let balance: Decimal;
      if (row.account_type === 'INCOME') {
        balance = credits.minus(debits);
      } else {
        balance = debits.minus(credits);
      }

      const accountRow: ReportAccountRow = {
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        accountType: row.account_type,
        accountSubType: row.account_sub_type,
        isContra: row.is_contra,
        debitTotal: debits.toFixed(4),
        creditTotal: credits.toFixed(4),
        balance: balance.toFixed(4),
      };

      const key = `${row.account_type}:${row.account_sub_type}`;
      if (!accountsBySubType[key]) {
        accountsBySubType[key] = [];
      }
      accountsBySubType[key].push(accountRow);
    }

    // Helper to sum balance in a group
    const sumGroup = (key: string): Decimal => {
      const items = accountsBySubType[key] || [];
      return items.reduce((sum, a) => sum.plus(new Decimal(a.balance)), new Decimal(0));
    };

    const buildSection = (label: string, key: string): PLSection => ({
      label,
      accounts: accountsBySubType[key] || [],
      total: sumGroup(key).toFixed(4),
    });

    // Income sections
    const salesRevenue = buildSection('Sales Revenue', 'INCOME:SALES_REVENUE');
    const otherIncome = buildSection('Other Income', 'INCOME:OTHER_INCOME');
    const serviceRevenue = buildSection('Service Revenue', 'INCOME:SERVICE_REVENUE');

    const totalIncome = new Decimal(salesRevenue.total)
      .plus(new Decimal(otherIncome.total))
      .plus(new Decimal(serviceRevenue.total));

    // COGS
    const cogs = buildSection('Cost of Goods Sold', 'EXPENSE:COST_OF_GOODS_SOLD');
    const grossProfit = totalIncome.minus(new Decimal(cogs.total));

    // Operating expenses
    const operatingExpenses = buildSection('Operating Expenses', 'EXPENSE:OPERATING_EXPENSE');
    const payrollExpenses = buildSection('Payroll Expenses', 'EXPENSE:PAYROLL_EXPENSE');
    const rentExpenses = buildSection('Rent & Occupancy', 'EXPENSE:RENT_AND_OCCUPANCY');
    const utilityExpenses = buildSection('Utilities', 'EXPENSE:UTILITIES');
    const officeExpenses = buildSection('Office Expenses', 'EXPENSE:OFFICE_EXPENSE');
    const depreciationExpense = buildSection('Depreciation', 'EXPENSE:DEPRECIATION');
    const travelExpenses = buildSection('Travel & Entertainment', 'EXPENSE:TRAVEL');

    const totalOperatingExpenses = new Decimal(operatingExpenses.total)
      .plus(new Decimal(payrollExpenses.total))
      .plus(new Decimal(rentExpenses.total))
      .plus(new Decimal(utilityExpenses.total))
      .plus(new Decimal(officeExpenses.total))
      .plus(new Decimal(depreciationExpense.total))
      .plus(new Decimal(travelExpenses.total));

    const operatingProfit = grossProfit.minus(totalOperatingExpenses);

    // Other expenses
    const otherExpenses = buildSection('Other Expenses', 'EXPENSE:OTHER_EXPENSE');
    const interestExpense = buildSection('Interest Expense', 'EXPENSE:INTEREST_EXPENSE');
    const taxExpense = buildSection('Tax Expense', 'EXPENSE:TAX_EXPENSE');

    const totalOtherExpenses = new Decimal(otherExpenses.total)
      .plus(new Decimal(interestExpense.total))
      .plus(new Decimal(taxExpense.total));

    const netProfit = operatingProfit.minus(totalOtherExpenses);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      income: {
        salesRevenue,
        serviceRevenue,
        otherIncome,
        totalIncome: totalIncome.toFixed(4),
      },
      costOfGoodsSold: cogs,
      grossProfit: grossProfit.toFixed(4),
      operatingExpenses: {
        operatingExpenses,
        payrollExpenses,
        rentExpenses,
        utilityExpenses,
        officeExpenses,
        depreciationExpense,
        travelExpenses,
        totalOperatingExpenses: totalOperatingExpenses.toFixed(4),
      },
      operatingProfit: operatingProfit.toFixed(4),
      otherExpenses: {
        otherExpenses,
        interestExpense,
        taxExpense,
        totalOtherExpenses: totalOtherExpenses.toFixed(4),
      },
      netProfit: netProfit.toFixed(4),
    };
  }

  // ─── Balance Sheet ──────────────────────────────────────

  /**
   * Generate a Balance Sheet as of a given date.
   * Assets = Liabilities + Equity. Includes Current Year Earnings from P&L.
   */
  async getBalanceSheet(companyId: string, asOfDate: Date) {
    // Get all balance-sheet accounts
    const rows = await this.prisma.$queryRaw<
      Array<{
        account_id: string;
        account_code: string;
        account_name: string;
        account_type: string;
        account_sub_type: string;
        normal_balance: string;
        is_contra: boolean;
        total_debits: any;
        total_credits: any;
      }>
    >`
      SELECT
        a.id AS account_id,
        a.code AS account_code,
        a.name AS account_name,
        a.type AS account_type,
        a."subType" AS account_sub_type,
        a."normalBalance" AS normal_balance,
        a."isContra" AS is_contra,
        COALESCE(SUM(jl.debit), 0) AS total_debits,
        COALESCE(SUM(jl.credit), 0) AS total_credits
      FROM accounts a
      INNER JOIN journal_lines jl ON jl."accountId" = a.id
      INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
      WHERE a."companyId" = ${companyId}
        AND a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date <= ${asOfDate}
      GROUP BY a.id, a.code, a.name, a.type, a."subType", a."normalBalance", a."isContra"
      ORDER BY a.type, a."subType", a.code
    `;

    // Calculate current year earnings from P&L
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    // Determine fiscal year that contains asOfDate
    const fiscalYearStart = this.getFiscalYearStart(
      asOfDate,
      company?.fiscalYearStartMonth ?? 1,
    );

    const plResult = await this.getProfitAndLoss(companyId, fiscalYearStart, asOfDate);
    const currentYearEarnings = new Decimal(plResult.netProfit);

    // Process rows into sections
    const accountsBySection: Record<string, ReportAccountRow[]> = {};

    for (const row of rows) {
      const debits = new Decimal(row.total_debits?.toString() || '0');
      const credits = new Decimal(row.total_credits?.toString() || '0');

      // Assets: normal balance = DEBIT, so balance = debits - credits
      // Liabilities/Equity: normal balance = CREDIT, so balance = credits - debits
      let balance: Decimal;
      if (row.normal_balance === 'DEBIT') {
        balance = debits.minus(credits);
      } else {
        balance = credits.minus(debits);
      }

      // Contra accounts flip the sign
      if (row.is_contra) {
        balance = balance.negated();
      }

      let subType = row.account_sub_type;
      if (row.account_type === 'EQUITY' && subType === 'OPENING_BALANCE') {
        subType = 'OTHER_EQUITY';
      }
      const key = `${row.account_type}:${subType}`;
      if (!accountsBySection[key]) {
        accountsBySection[key] = [];
      }
      accountsBySection[key].push({
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        accountType: row.account_type,
        accountSubType: row.account_sub_type,
        isContra: row.is_contra,
        debitTotal: debits.toFixed(4),
        creditTotal: credits.toFixed(4),
        balance: balance.toFixed(4),
      });
    }

    const sumSection = (key: string): Decimal => {
      return (accountsBySection[key] || []).reduce(
        (sum, a) => sum.plus(new Decimal(a.balance)),
        new Decimal(0),
      );
    };

    const buildSection = (label: string, key: string) => ({
      label,
      accounts: accountsBySection[key] || [],
      total: sumSection(key).toFixed(4),
    });

    // Assets
    const cashAndBank = buildSection('Cash & Bank', 'ASSET:CASH_AND_BANK');
    const accountsReceivable = buildSection('Accounts Receivable', 'ASSET:ACCOUNTS_RECEIVABLE');
    const currentAssets = buildSection('Current Assets', 'ASSET:CURRENT_ASSET');
    const inventory = buildSection('Inventory', 'ASSET:INVENTORY');
    const fixedAssets = buildSection('Fixed Assets', 'ASSET:FIXED_ASSET');
    const otherAssets = buildSection('Other Assets', 'ASSET:OTHER_ASSET');
    const taxReceivable = buildSection('Tax Receivable', 'ASSET:TAX_RECEIVABLE');

    const totalAssets = new Decimal(cashAndBank.total)
      .plus(new Decimal(accountsReceivable.total))
      .plus(new Decimal(currentAssets.total))
      .plus(new Decimal(inventory.total))
      .plus(new Decimal(fixedAssets.total))
      .plus(new Decimal(otherAssets.total))
      .plus(new Decimal(taxReceivable.total));

    // Liabilities
    const accountsPayable = buildSection('Accounts Payable', 'LIABILITY:ACCOUNTS_PAYABLE');
    const currentLiabilities = buildSection('Current Liabilities', 'LIABILITY:CURRENT_LIABILITY');
    const longTermLiabilities = buildSection('Long-term Liabilities', 'LIABILITY:LONG_TERM_LIABILITY');
    const taxPayable = buildSection('Tax Payable', 'LIABILITY:TAX_PAYABLE');
    const otherLiabilities = buildSection('Other Liabilities', 'LIABILITY:OTHER_LIABILITY');

    const totalLiabilities = new Decimal(accountsPayable.total)
      .plus(new Decimal(currentLiabilities.total))
      .plus(new Decimal(longTermLiabilities.total))
      .plus(new Decimal(taxPayable.total))
      .plus(new Decimal(otherLiabilities.total));

    // Equity
    const ownersEquity = buildSection('Owner\'s Equity', 'EQUITY:OWNERS_EQUITY');
    const retainedEarnings = buildSection('Retained Earnings', 'EQUITY:RETAINED_EARNINGS');
    const otherEquity = buildSection('Other Equity', 'EQUITY:OTHER_EQUITY');

    const totalEquityAccounts = new Decimal(ownersEquity.total)
      .plus(new Decimal(retainedEarnings.total))
      .plus(new Decimal(otherEquity.total))
      .plus(currentYearEarnings);

    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquityAccounts);
    const isBalanced = totalAssets.equals(totalLiabilitiesAndEquity);

    return {
      asOfDate: asOfDate.toISOString().split('T')[0],
      assets: {
        cashAndBank,
        accountsReceivable,
        currentAssets,
        inventory,
        fixedAssets,
        otherAssets,
        taxReceivable,
        totalAssets: totalAssets.toFixed(4),
      },
      liabilities: {
        accountsPayable,
        currentLiabilities,
        longTermLiabilities,
        taxPayable,
        otherLiabilities,
        totalLiabilities: totalLiabilities.toFixed(4),
      },
      equity: {
        ownersEquity,
        retainedEarnings,
        otherEquity,
        currentYearEarnings: currentYearEarnings.toFixed(4),
        totalEquity: totalEquityAccounts.toFixed(4),
      },
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toFixed(4),
      isBalanced,
    };
  }

  // ─── Cash Flow Statement ────────────────────────────────

  /**
   * Generate a Cash Flow Statement using the indirect method.
   */
  async getCashFlowStatement(companyId: string, startDate: Date, endDate: Date) {
    // 1. Start with Net Income from P&L
    const plResult = await this.getProfitAndLoss(companyId, startDate, endDate);
    const netIncome = new Decimal(plResult.netProfit);

    // 2. Get balance changes for working capital accounts
    const getBalanceChange = async (subType: string, accountType: string): Promise<Decimal> => {
      const result = await this.prisma.$queryRaw<
        Array<{ balance_start: any; balance_end: any }>
      >`
        SELECT
          COALESCE((
            SELECT SUM(CASE WHEN a."normalBalance" = 'DEBIT' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END)
            FROM journal_lines jl
            INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
            INNER JOIN accounts a ON a.id = jl."accountId"
            WHERE a."companyId" = ${companyId}
              AND a.type = ${accountType}
              AND a."subType" = ${subType}
              AND je."isPosted" = true
              AND je."isVoided" = false
              AND je.date < ${startDate}
          ), 0) AS balance_start,
          COALESCE((
            SELECT SUM(CASE WHEN a."normalBalance" = 'DEBIT' THEN jl.debit - jl.credit ELSE jl.credit - jl.debit END)
            FROM journal_lines jl
            INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
            INNER JOIN accounts a ON a.id = jl."accountId"
            WHERE a."companyId" = ${companyId}
              AND a.type = ${accountType}
              AND a."subType" = ${subType}
              AND je."isPosted" = true
              AND je."isVoided" = false
              AND je.date <= ${endDate}
          ), 0) AS balance_end
      `;

      const balStart = new Decimal(result[0]?.balance_start?.toString() || '0');
      const balEnd = new Decimal(result[0]?.balance_end?.toString() || '0');
      return balEnd.minus(balStart);
    };

    // Non-cash adjustments
    const depreciationRows = await this.prisma.$queryRaw<
      Array<{ total: any }>
    >`
      SELECT COALESCE(SUM(jl.debit), 0) AS total
      FROM journal_lines jl
      INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
      INNER JOIN accounts a ON a.id = jl."accountId"
      WHERE a."companyId" = ${companyId}
        AND a."subType" = 'DEPRECIATION'
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
    `;

    const depreciation = new Decimal(depreciationRows[0]?.total?.toString() || '0');

    // Working capital changes
    const arChange = await getBalanceChange('ACCOUNTS_RECEIVABLE', 'ASSET');
    const apChange = await getBalanceChange('ACCOUNTS_PAYABLE', 'LIABILITY');
    const inventoryChange = await getBalanceChange('INVENTORY', 'ASSET');
    const otherCurrentAssetChange = await getBalanceChange('CURRENT_ASSET', 'ASSET');
    const otherCurrentLiabilityChange = await getBalanceChange('CURRENT_LIABILITY', 'LIABILITY');
    const creditCardChange = await getBalanceChange('CREDIT_CARD', 'LIABILITY');

    // Operating: AR increase = cash outflow (negative), AP increase = cash inflow (positive)
    const arAdjustment = arChange.negated(); // Increase in AR = less cash
    const apAdjustment = apChange;            // Increase in AP = more cash
    const inventoryAdjustment = inventoryChange.negated(); // Increase in inventory = less cash
    const otherCurrentAssetAdjustment = otherCurrentAssetChange.negated();
    const otherCurrentLiabilityAdjustment = otherCurrentLiabilityChange;
    const creditCardAdjustment = creditCardChange;

    const operatingCashFlow = netIncome
      .plus(depreciation)
      .plus(arAdjustment)
      .plus(apAdjustment)
      .plus(inventoryAdjustment)
      .plus(otherCurrentAssetAdjustment)
      .plus(otherCurrentLiabilityAdjustment)
      .plus(creditCardAdjustment);

    // Investing: Fixed asset changes
    const fixedAssetChange = await getBalanceChange('FIXED_ASSET', 'ASSET');
    const investingCashFlow = fixedAssetChange.negated(); // Purchase of assets = negative

    // Financing: Equity and long-term liability changes
    const equityChange = await getBalanceChange('OWNERS_EQUITY', 'EQUITY');
    const retainedEarningsChange = await getBalanceChange('RETAINED_EARNINGS', 'EQUITY');
    const longTermDebtChange = await getBalanceChange('LONG_TERM_LIABILITY', 'LIABILITY');

    const financingCashFlow = equityChange
      .plus(retainedEarningsChange)
      .plus(longTermDebtChange);

    const netChangeInCash = operatingCashFlow.plus(investingCashFlow).plus(financingCashFlow);

    // Beginning and ending cash balances
    const cashBalances = await this.prisma.$queryRaw<
      Array<{ beginning: any; ending: any }>
    >`
      SELECT
        COALESCE((
          SELECT SUM(jl.debit - jl.credit)
          FROM journal_lines jl
          INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
          INNER JOIN accounts a ON a.id = jl."accountId"
          WHERE a."companyId" = ${companyId}
            AND a."subType" = 'CASH_AND_BANK'
            AND je."isPosted" = true
            AND je."isVoided" = false
            AND je.date < ${startDate}
        ), 0) AS beginning,
        COALESCE((
          SELECT SUM(jl.debit - jl.credit)
          FROM journal_lines jl
          INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
          INNER JOIN accounts a ON a.id = jl."accountId"
          WHERE a."companyId" = ${companyId}
            AND a."subType" = 'CASH_AND_BANK'
            AND je."isPosted" = true
            AND je."isVoided" = false
            AND je.date <= ${endDate}
        ), 0) AS ending
    `;

    const beginningCash = new Decimal(cashBalances[0]?.beginning?.toString() || '0');
    const endingCash = new Decimal(cashBalances[0]?.ending?.toString() || '0');

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      operatingActivities: {
        netIncome: netIncome.toFixed(4),
        adjustments: {
          depreciation: depreciation.toFixed(4),
          accountsReceivable: arAdjustment.toFixed(4),
          accountsPayable: apAdjustment.toFixed(4),
          inventory: inventoryAdjustment.toFixed(4),
          otherCurrentAssets: otherCurrentAssetAdjustment.toFixed(4),
          otherCurrentLiabilities: otherCurrentLiabilityAdjustment.toFixed(4),
          creditCard: creditCardAdjustment.toFixed(4),
        },
        totalOperatingCashFlow: operatingCashFlow.toFixed(4),
      },
      investingActivities: {
        fixedAssetPurchases: fixedAssetChange.negated().toFixed(4),
        totalInvestingCashFlow: investingCashFlow.toFixed(4),
      },
      financingActivities: {
        equityChanges: equityChange.toFixed(4),
        retainedEarningsChanges: retainedEarningsChange.toFixed(4),
        longTermDebtChanges: longTermDebtChange.toFixed(4),
        totalFinancingCashFlow: financingCashFlow.toFixed(4),
      },
      netChangeInCash: netChangeInCash.toFixed(4),
      beginningCashBalance: beginningCash.toFixed(4),
      endingCashBalance: endingCash.toFixed(4),
    };
  }

  // ─── Aged Receivables ───────────────────────────────────

  /**
   * Aged Receivables: group outstanding invoices by customer and aging bucket.
   */
  async getAgedReceivables(companyId: string, asOfDate: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        companyId,
        isVoided: false,
        amountDue: { gt: 0 },
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const customerBuckets: Record<
      string,
      {
        customerId: string;
        customerName: string;
        invoices: Array<{
          invoiceId: string;
          invoiceNumber: string;
          invoiceDate: string;
          dueDate: string;
          total: string;
          amountDue: string;
          daysOverdue: number;
          bucket: string;
        }>;
      } & AgingBucket
    > = {};

    const totals: AgingBucket = {
      current: '0',
      days1to30: '0',
      days31to60: '0',
      days61to90: '0',
      days90plus: '0',
      total: '0',
    };

    let totalCurrent = new Decimal(0);
    let total1to30 = new Decimal(0);
    let total31to60 = new Decimal(0);
    let total61to90 = new Decimal(0);
    let total90plus = new Decimal(0);

    for (const inv of invoices) {
      const amountDue = new Decimal(inv.amountDue.toString());
      const dueDate = new Date(inv.dueDate);
      const diffMs = asOfDate.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: string;
      if (daysOverdue <= 0) {
        bucket = 'current';
        totalCurrent = totalCurrent.plus(amountDue);
      } else if (daysOverdue <= 30) {
        bucket = '1-30';
        total1to30 = total1to30.plus(amountDue);
      } else if (daysOverdue <= 60) {
        bucket = '31-60';
        total31to60 = total31to60.plus(amountDue);
      } else if (daysOverdue <= 90) {
        bucket = '61-90';
        total61to90 = total61to90.plus(amountDue);
      } else {
        bucket = '90+';
        total90plus = total90plus.plus(amountDue);
      }

      if (!customerBuckets[inv.customerId]) {
        customerBuckets[inv.customerId] = {
          customerId: inv.customerId,
          customerName: inv.customer.name,
          current: '0',
          days1to30: '0',
          days31to60: '0',
          days61to90: '0',
          days90plus: '0',
          total: '0',
          invoices: [],
        };
      }

      const custBucket = customerBuckets[inv.customerId];

      // Add to customer bucket
      switch (bucket) {
        case 'current':
          custBucket.current = new Decimal(custBucket.current).plus(amountDue).toFixed(4);
          break;
        case '1-30':
          custBucket.days1to30 = new Decimal(custBucket.days1to30).plus(amountDue).toFixed(4);
          break;
        case '31-60':
          custBucket.days31to60 = new Decimal(custBucket.days31to60).plus(amountDue).toFixed(4);
          break;
        case '61-90':
          custBucket.days61to90 = new Decimal(custBucket.days61to90).plus(amountDue).toFixed(4);
          break;
        case '90+':
          custBucket.days90plus = new Decimal(custBucket.days90plus).plus(amountDue).toFixed(4);
          break;
      }

      custBucket.total = new Decimal(custBucket.total).plus(amountDue).toFixed(4);

      custBucket.invoices.push({
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        invoiceDate: inv.date.toISOString().split('T')[0],
        dueDate: inv.dueDate.toISOString().split('T')[0],
        total: inv.total.toString(),
        amountDue: amountDue.toFixed(4),
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      });
    }

    const grandTotal = totalCurrent
      .plus(total1to30)
      .plus(total31to60)
      .plus(total61to90)
      .plus(total90plus);

    return {
      asOfDate: asOfDate.toISOString().split('T')[0],
      customers: Object.values(customerBuckets),
      totals: {
        current: totalCurrent.toFixed(4),
        days1to30: total1to30.toFixed(4),
        days31to60: total31to60.toFixed(4),
        days61to90: total61to90.toFixed(4),
        days90plus: total90plus.toFixed(4),
        total: grandTotal.toFixed(4),
      },
    };
  }

  // ─── Aged Payables ──────────────────────────────────────

  /**
   * Aged Payables: group outstanding bills by vendor and aging bucket.
   */
  async getAgedPayables(companyId: string, asOfDate: Date) {
    const bills = await this.prisma.bill.findMany({
      where: {
        companyId,
        isVoided: false,
        amountDue: { gt: 0 },
      },
      include: {
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const vendorBuckets: Record<
      string,
      {
        vendorId: string;
        vendorName: string;
        bills: Array<{
          billId: string;
          billNumber: string;
          billDate: string;
          dueDate: string;
          total: string;
          amountDue: string;
          daysOverdue: number;
          bucket: string;
        }>;
      } & AgingBucket
    > = {};

    let totalCurrent = new Decimal(0);
    let total1to30 = new Decimal(0);
    let total31to60 = new Decimal(0);
    let total61to90 = new Decimal(0);
    let total90plus = new Decimal(0);

    for (const bill of bills) {
      const amountDue = new Decimal(bill.amountDue.toString());
      const dueDate = new Date(bill.dueDate);
      const diffMs = asOfDate.getTime() - dueDate.getTime();
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucket: string;
      if (daysOverdue <= 0) {
        bucket = 'current';
        totalCurrent = totalCurrent.plus(amountDue);
      } else if (daysOverdue <= 30) {
        bucket = '1-30';
        total1to30 = total1to30.plus(amountDue);
      } else if (daysOverdue <= 60) {
        bucket = '31-60';
        total31to60 = total31to60.plus(amountDue);
      } else if (daysOverdue <= 90) {
        bucket = '61-90';
        total61to90 = total61to90.plus(amountDue);
      } else {
        bucket = '90+';
        total90plus = total90plus.plus(amountDue);
      }

      if (!vendorBuckets[bill.vendorId]) {
        vendorBuckets[bill.vendorId] = {
          vendorId: bill.vendorId,
          vendorName: bill.vendor.name,
          current: '0',
          days1to30: '0',
          days31to60: '0',
          days61to90: '0',
          days90plus: '0',
          total: '0',
          bills: [],
        };
      }

      const vBucket = vendorBuckets[bill.vendorId];

      switch (bucket) {
        case 'current':
          vBucket.current = new Decimal(vBucket.current).plus(amountDue).toFixed(4);
          break;
        case '1-30':
          vBucket.days1to30 = new Decimal(vBucket.days1to30).plus(amountDue).toFixed(4);
          break;
        case '31-60':
          vBucket.days31to60 = new Decimal(vBucket.days31to60).plus(amountDue).toFixed(4);
          break;
        case '61-90':
          vBucket.days61to90 = new Decimal(vBucket.days61to90).plus(amountDue).toFixed(4);
          break;
        case '90+':
          vBucket.days90plus = new Decimal(vBucket.days90plus).plus(amountDue).toFixed(4);
          break;
      }

      vBucket.total = new Decimal(vBucket.total).plus(amountDue).toFixed(4);

      vBucket.bills.push({
        billId: bill.id,
        billNumber: bill.number,
        billDate: bill.date.toISOString().split('T')[0],
        dueDate: bill.dueDate.toISOString().split('T')[0],
        total: bill.total.toString(),
        amountDue: amountDue.toFixed(4),
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      });
    }

    const grandTotal = totalCurrent
      .plus(total1to30)
      .plus(total31to60)
      .plus(total61to90)
      .plus(total90plus);

    return {
      asOfDate: asOfDate.toISOString().split('T')[0],
      vendors: Object.values(vendorBuckets),
      totals: {
        current: totalCurrent.toFixed(4),
        days1to30: total1to30.toFixed(4),
        days31to60: total31to60.toFixed(4),
        days61to90: total61to90.toFixed(4),
        days90plus: total90plus.toFixed(4),
        total: grandTotal.toFixed(4),
      },
    };
  }

  // ─── Tax Summary ────────────────────────────────────────

  /**
   * Tax Summary: output tax (sales tax payable credits), input tax (tax receivable debits),
   * and net tax payable.
   */
  async getTaxSummary(companyId: string, startDate: Date, endDate: Date) {
    // Output tax: Credits to Tax Payable accounts (from invoices)
    const outputTaxRows = await this.prisma.$queryRaw<
      Array<{ total_credits: any }>
    >`
      SELECT COALESCE(SUM(jl.credit), 0) AS total_credits
      FROM journal_lines jl
      INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
      INNER JOIN accounts a ON a.id = jl."accountId"
      WHERE a."companyId" = ${companyId}
        AND a."systemTag" = 'TAX_PAYABLE'
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
    `;

    // Input tax: Debits to Tax Receivable accounts (from bills/expenses)
    const inputTaxRows = await this.prisma.$queryRaw<
      Array<{ total_debits: any }>
    >`
      SELECT COALESCE(SUM(jl.debit), 0) AS total_debits
      FROM journal_lines jl
      INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
      INNER JOIN accounts a ON a.id = jl."accountId"
      WHERE a."companyId" = ${companyId}
        AND a."systemTag" = 'TAX_RECEIVABLE'
        AND je."isPosted" = true
        AND je."isVoided" = false
        AND je.date >= ${startDate}
        AND je.date <= ${endDate}
    `;

    const outputTax = new Decimal(outputTaxRows[0]?.total_credits?.toString() || '0');
    const inputTax = new Decimal(inputTaxRows[0]?.total_debits?.toString() || '0');
    const netPayable = outputTax.minus(inputTax);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      outputTax: outputTax.toFixed(4),
      inputTax: inputTax.toFixed(4),
      netTaxPayable: netPayable.toFixed(4),
    };
  }

  // ─── General Ledger ─────────────────────────────────────

  /**
   * General Ledger for a specific account within a date range.
   */
  async getGeneralLedger(
    companyId: string,
    accountId: string | undefined,
    startDate: Date,
    endDate: Date,
  ) {
    if (accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, companyId },
      });

      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      // Opening balance (before startDate)
      const openingRows = await this.prisma.$queryRaw<
        Array<{ total_debits: any; total_credits: any }>
      >`
        SELECT
          COALESCE(SUM(jl.debit), 0) AS total_debits,
          COALESCE(SUM(jl.credit), 0) AS total_credits
        FROM journal_lines jl
        INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
        WHERE jl."accountId" = ${accountId}
          AND je."companyId" = ${companyId}
          AND je."isPosted" = true
          AND je."isVoided" = false
          AND je.date < ${startDate}
      `;

      const openDebits = new Decimal(openingRows[0]?.total_debits?.toString() || '0');
      const openCredits = new Decimal(openingRows[0]?.total_credits?.toString() || '0');
      let openingBalance: Decimal;
      if (account.normalBalance === 'DEBIT') {
        openingBalance = openDebits.minus(openCredits);
      } else {
        openingBalance = openCredits.minus(openDebits);
      }

      // Lines in period
      const lines = await this.prisma.journalLine.findMany({
        where: {
          accountId,
          journalEntry: {
            companyId,
            isPosted: true,
            isVoided: false,
            date: { gte: startDate, lte: endDate },
          },
        },
        include: {
          journalEntry: {
            select: {
              id: true,
              number: true,
              date: true,
              memo: true,
              sourceType: true,
              sourceId: true,
            },
          },
        },
        orderBy: { journalEntry: { date: 'asc' } },
      });

      let runningBalance = openingBalance;
      const ledgerLines = lines.map((line) => {
        const debit = new Decimal(line.debit.toString());
        const credit = new Decimal(line.credit.toString());

        if (account.normalBalance === 'DEBIT') {
          runningBalance = runningBalance.plus(debit).minus(credit);
        } else {
          runningBalance = runningBalance.plus(credit).minus(debit);
        }

        return {
          lineId: line.id,
          journalId: line.journalEntry.id,
          journalNumber: line.journalEntry.number,
          date: (line.journalEntry.date as Date).toISOString().split('T')[0],
          memo: line.journalEntry.memo,
          sourceType: line.journalEntry.sourceType,
          description: line.description,
          debit: debit.toFixed(4),
          credit: credit.toFixed(4),
          balance: runningBalance.toFixed(4),
        };
      });

      return {
        account: {
          id: account.id,
          code: account.code,
          name: account.name,
          type: account.type,
          subType: account.subType,
          normalBalance: account.normalBalance,
        },
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        openingBalance: openingBalance.toFixed(4),
        closingBalance: runningBalance.toFixed(4),
        lines: ledgerLines,
      };
    } else {
      const activeAccounts = await this.prisma.account.findMany({
        where: { companyId, isActive: true },
        orderBy: { code: 'asc' },
      });

      const accountsResult = [];

      for (const account of activeAccounts) {
        const openingRows = await this.prisma.$queryRaw<
          Array<{ total_debits: any; total_credits: any }>
        >`
          SELECT
            COALESCE(SUM(jl.debit), 0) AS total_debits,
            COALESCE(SUM(jl.credit), 0) AS total_credits
          FROM journal_lines jl
          INNER JOIN journal_entries je ON je.id = jl."journalEntryId"
          WHERE jl."accountId" = ${account.id}
            AND je."companyId" = ${companyId}
            AND je."isPosted" = true
            AND je."isVoided" = false
            AND je.date < ${startDate}
        `;

        const openDebits = new Decimal(openingRows[0]?.total_debits?.toString() || '0');
        const openCredits = new Decimal(openingRows[0]?.total_credits?.toString() || '0');
        let openingBalance: Decimal;
        if (account.normalBalance === 'DEBIT') {
          openingBalance = openDebits.minus(openCredits);
        } else {
          openingBalance = openCredits.minus(openDebits);
        }

        const lines = await this.prisma.journalLine.findMany({
          where: {
            accountId: account.id,
            journalEntry: {
              companyId,
              isPosted: true,
              isVoided: false,
              date: { gte: startDate, lte: endDate },
            },
          },
          include: {
            journalEntry: {
              select: {
                id: true,
                number: true,
                date: true,
                memo: true,
                sourceType: true,
                sourceId: true,
              },
            },
          },
          orderBy: { journalEntry: { date: 'asc' } },
        });

        // Skip accounts that have both 0 opening balance and 0 activity
        if (openingBalance.isZero() && lines.length === 0) {
          continue;
        }

        let runningBalance = openingBalance;
        const ledgerLines = lines.map((line) => {
          const debit = new Decimal(line.debit.toString());
          const credit = new Decimal(line.credit.toString());

          if (account.normalBalance === 'DEBIT') {
            runningBalance = runningBalance.plus(debit).minus(credit);
          } else {
            runningBalance = runningBalance.plus(credit).minus(debit);
          }

          return {
            lineId: line.id,
            journalId: line.journalEntry.id,
            journalNumber: line.journalEntry.number,
            date: (line.journalEntry.date as Date).toISOString().split('T')[0],
            memo: line.journalEntry.memo,
            sourceType: line.journalEntry.sourceType,
            description: line.description,
            debit: debit.toFixed(4),
            credit: credit.toFixed(4),
            balance: runningBalance.toFixed(4),
          };
        });

        accountsResult.push({
          account: {
            id: account.id,
            code: account.code,
            name: account.name,
            type: account.type,
            subType: account.subType,
            normalBalance: account.normalBalance,
          },
          openingBalance: openingBalance.toFixed(4),
          closingBalance: runningBalance.toFixed(4),
          lines: ledgerLines,
        });
      }

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        accounts: accountsResult,
      };
    }
  }

  // ─── Helpers ────────────────────────────────────────────

  private getFiscalYearStart(asOfDate: Date, fiscalYearStartMonth: number): Date {
    const year = asOfDate.getFullYear();
    const month = asOfDate.getMonth() + 1; // 1-indexed

    let fiscalYearStartYear: number;
    if (month >= fiscalYearStartMonth) {
      fiscalYearStartYear = year;
    } else {
      fiscalYearStartYear = year - 1;
    }

    return new Date(fiscalYearStartYear, fiscalYearStartMonth - 1, 1);
  }
}

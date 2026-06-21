import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportService } from '../report/report.service';
import Decimal from 'decimal.js';

describe('Golden Books Verification - Cedar Lane Retail', () => {
  let appModule: TestingModule;
  let prisma: PrismaService;
  let reportService: ReportService;

  beforeAll(async () => {
    appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = appModule.get<PrismaService>(PrismaService);
    reportService = appModule.get<ReportService>(ReportService);
  });

  afterAll(async () => {
    if (appModule) {
      await appModule.close();
    }
  });

  it('should verify Cedar Lane Retail financial figures match the golden books spec to the cent', async () => {
    // 1. Fetch Cedar Lane Retail company
    const company = await prisma.company.findFirst({
      where: { name: { contains: 'Cedar Lane Retail' } },
    });
    expect(company).toBeDefined();
    expect(company).not.toBeNull();
    const companyId = company!.id;

    // 2. Assert Trial Balance as of 31 Jan 2025
    const trialBalance = await reportService.getTrialBalance(companyId, new Date('2025-01-31T23:59:59Z'));
    expect(trialBalance.isBalanced).toBe(true);

    // Sum of net balances must be 81,130.00
    let netDebitSum = new Decimal(0);
    let netCreditSum = new Decimal(0);
    for (const acct of trialBalance.accounts) {
      const balance = new Decimal(acct.balance);
      const isDebitNormal = acct.accountType === 'ASSET' || acct.accountType === 'EXPENSE';
      const normalBalance = isDebitNormal ? 'DEBIT' : 'CREDIT';

      if (normalBalance === 'DEBIT') {
        if (balance.gt(0)) netDebitSum = netDebitSum.plus(balance);
        else netCreditSum = netCreditSum.plus(balance.abs());
      } else {
        if (balance.gt(0)) netCreditSum = netCreditSum.plus(balance);
        else netDebitSum = netDebitSum.plus(balance.abs());
      }
    }
    expect(netDebitSum.toNumber()).toBe(81130);
    expect(netCreditSum.toNumber()).toBe(81130);

    // 3. Assert Profit & Loss for January 2025
    const profitLoss = await reportService.getProfitAndLoss(
      companyId,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-31T23:59:59Z'),
    );
    expect(new Decimal(profitLoss.grossProfit).toNumber()).toBe(400);
    expect(new Decimal(profitLoss.netProfit).toNumber()).toBe(-1650);

    // 4. Assert Balance Sheet as of 31 Jan 2025
    const balanceSheet = await reportService.getBalanceSheet(companyId, new Date('2025-01-31T23:59:59Z'));
    console.log('BALANCE SHEET DEBUG:', JSON.stringify(balanceSheet, null, 2));
    expect(balanceSheet.isBalanced).toBe(true);
    expect(new Decimal(balanceSheet.assets.totalAssets).toNumber()).toBe(78480);
    expect(new Decimal(balanceSheet.liabilities.totalLiabilities).toNumber()).toBe(20130);
    expect(new Decimal(balanceSheet.equity.totalEquity).toNumber()).toBe(58350);
    expect(new Decimal(balanceSheet.totalLiabilitiesAndEquity).toNumber()).toBe(78480);

    // 5. Assert Cash Flow statement for January 2025
    const cashFlow = await reportService.getCashFlowStatement(
      companyId,
      new Date('2025-01-01T00:00:00Z'),
      new Date('2025-01-31T23:59:59Z'),
    );
    expect(new Decimal(cashFlow.netChangeInCash).toNumber()).toBe(-1180);
    expect(new Decimal(cashFlow.beginningCashBalance).toNumber()).toBe(50000);
    expect(new Decimal(cashFlow.endingCashBalance).toNumber()).toBe(48820);
  });
});

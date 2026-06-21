// ============================================================
// LedgerFlow — Comprehensive Seed Data
// Creates a fully populated demo environment
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

// ── Helper Types ──────────────────────────────────────────

interface SeedAccount {
  code: string;
  name: string;
  type: string;
  subType: string;
  normalBalance: string;
  isSystem: boolean;
  isContra: boolean;
  systemTag?: string;
  description?: string;
}

// ── Default Chart of Accounts ─────────────────────────────

const DEFAULT_COA: SeedAccount[] = [
  // Assets
  { code: '1000', name: 'Petty Cash', type: 'ASSET', subType: 'CASH_AND_BANK', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1010', name: 'Business Checking Account', type: 'ASSET', subType: 'CASH_AND_BANK', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1020', name: 'Business Savings Account', type: 'ASSET', subType: 'CASH_AND_BANK', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1050', name: 'Undeposited Funds', type: 'ASSET', subType: 'CASH_AND_BANK', normalBalance: 'DEBIT', isSystem: true, isContra: false, systemTag: 'UNDEPOSITED_FUNDS' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'ACCOUNTS_RECEIVABLE', normalBalance: 'DEBIT', isSystem: true, isContra: false, systemTag: 'AR' },
  { code: '1200', name: 'Prepaid Expenses', type: 'ASSET', subType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1250', name: 'Input Tax / Tax Receivable', type: 'ASSET', subType: 'CURRENT_ASSET', normalBalance: 'DEBIT', isSystem: true, isContra: false, systemTag: 'TAX_RECEIVABLE' },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET', subType: 'INVENTORY', normalBalance: 'DEBIT', isSystem: true, isContra: false, systemTag: 'INVENTORY' },
  { code: '1500', name: 'Furniture & Equipment', type: 'ASSET', subType: 'FIXED_ASSET', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1520', name: 'Computer Equipment', type: 'ASSET', subType: 'FIXED_ASSET', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '1600', name: 'Accumulated Depreciation', type: 'ASSET', subType: 'FIXED_ASSET', normalBalance: 'CREDIT', isSystem: false, isContra: true, systemTag: 'ACCUM_DEPRECIATION' },
  // Liabilities
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'ACCOUNTS_PAYABLE', normalBalance: 'CREDIT', isSystem: true, isContra: false, systemTag: 'AP' },
  { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', isSystem: true, isContra: false, systemTag: 'TAX_PAYABLE' },
  { code: '2150', name: 'Accrued Liabilities', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '2200', name: 'Credit Card Payable', type: 'LIABILITY', subType: 'CREDIT_CARD', normalBalance: 'CREDIT', isSystem: false, isContra: false, systemTag: 'CREDIT_CARD' },
  { code: '2500', name: 'Bank Loan', type: 'LIABILITY', subType: 'LONG_TERM_LIABILITY', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  // Equity
  { code: '3000', name: "Owner's Equity", type: 'EQUITY', subType: 'OWNERS_EQUITY', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY', subType: 'RETAINED_EARNINGS', normalBalance: 'CREDIT', isSystem: true, isContra: false, systemTag: 'RETAINED_EARNINGS' },
  { code: '3300', name: 'Opening Balance Equity', type: 'EQUITY', subType: 'OPENING_BALANCE', normalBalance: 'CREDIT', isSystem: true, isContra: false, systemTag: 'OPENING_BALANCE_EQUITY' },
  // Income
  { code: '4000', name: 'Sales Revenue', type: 'INCOME', subType: 'SALES_REVENUE', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '4010', name: 'Service Revenue', type: 'INCOME', subType: 'SALES_REVENUE', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '4020', name: 'Project Revenue', type: 'INCOME', subType: 'SALES_REVENUE', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '4500', name: 'Interest Income', type: 'INCOME', subType: 'OTHER_INCOME', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  { code: '4510', name: 'Other Income', type: 'INCOME', subType: 'OTHER_INCOME', normalBalance: 'CREDIT', isSystem: false, isContra: false },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE', subType: 'COST_OF_GOODS_SOLD', normalBalance: 'DEBIT', isSystem: false, isContra: false, systemTag: 'COGS' },
  { code: '6000', name: 'Advertising & Marketing', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6020', name: 'Bank Fees & Charges', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false, systemTag: 'BANK_FEES' },
  { code: '6030', name: 'Depreciation Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false, systemTag: 'DEPRECIATION' },
  { code: '6040', name: 'Insurance', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6050', name: 'Legal & Professional Fees', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6060', name: 'Office Supplies', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6070', name: 'Rent Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6080', name: 'Repairs & Maintenance', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6090', name: 'Software & Subscriptions', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6100', name: 'Telephone & Internet', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6110', name: 'Travel Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6120', name: 'Utilities', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6160', name: 'Miscellaneous Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6200', name: 'Bad Debt Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false, systemTag: 'BAD_DEBT' },
  { code: '6300', name: 'Wages & Salaries', type: 'EXPENSE', subType: 'PAYROLL_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false },
  { code: '6600', name: 'Rounding Adjustment', type: 'EXPENSE', subType: 'OTHER_EXPENSE', normalBalance: 'DEBIT', isSystem: false, isContra: false, systemTag: 'ROUNDING' },
];

// ── Helper Functions ──────────────────────────────────────

function getAccount(accounts: any[], systemTag: string) {
  const acct = accounts.find((a) => a.systemTag === systemTag);
  if (!acct) throw new Error(`System account not found: ${systemTag}`);
  return acct;
}

function getAccountByCode(accounts: any[], code: string) {
  const acct = accounts.find((a) => a.code === code);
  if (!acct) throw new Error(`Account not found by code: ${code}`);
  return acct;
}

function d(n: number): string {
  return new Decimal(n).toFixed(4);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

async function createJournal(
  companyId: string,
  number: string,
  date: Date,
  memo: string,
  sourceType: string,
  sourceId: string | null,
  purpose: string,
  lines: { accountId: string; debit: string; credit: string; description?: string; customerId?: string; vendorId?: string }[],
  createdBy: string,
) {
  // Verify balance
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  for (const line of lines) {
    totalDebit = totalDebit.plus(line.debit || '0');
    totalCredit = totalCredit.plus(line.credit || '0');
  }
  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Unbalanced journal ${number}: debits=${totalDebit.toFixed(4)} credits=${totalCredit.toFixed(4)}`);
  }

  const entry = await prisma.journalEntry.create({
    data: {
      companyId,
      number,
      date,
      memo,
      sourceType,
      sourceId,
      purpose,
      isPosted: true,
      postedAt: new Date(),
      createdBy,
      lines: {
        create: lines.map((l) => ({
          accountId: l.accountId,
          debit: l.debit || '0',
          credit: l.credit || '0',
          description: l.description,
          customerId: l.customerId,
          vendorId: l.vendorId,
        })),
      },
    },
    include: { lines: true },
  });
  return entry;
}

// ── Main Seed Function ────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding LedgerFlow demo data...\n');

  // Clean existing data
  await prisma.reconciliationLine.deleteMany();
  await prisma.reconciliationSession.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.bankRule.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.vendorPaymentAllocation.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.billLine.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.vendorPayment.deleteMany();
  await prisma.vendorCredit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.workflowRule.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.taxCode.deleteMany();
  await prisma.account.deleteMany();
  await prisma.fiscalPeriod.deleteMany();
  await prisma.fiscalYear.deleteMany();
  await prisma.companyUser.deleteMany();
  await prisma.session.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.company.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspaceSubscription.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.currency.deleteMany();

  // ── Currencies ─────────────────────────────────────────

  await prisma.currency.createMany({
    data: [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
      { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    ],
  });

  // ── Users ──────────────────────────────────────────────

  const password = await argon2.hash('Demo2024!');

  const sarah = await prisma.user.create({
    data: { email: 'sarah@northstar.demo', passwordHash: password, firstName: 'Sarah', lastName: 'Chen', emailVerified: true },
  });
  const marcus = await prisma.user.create({
    data: { email: 'marcus@northstar.demo', passwordHash: password, firstName: 'Marcus', lastName: 'Rivera', emailVerified: true },
  });
  const lisa = await prisma.user.create({
    data: { email: 'lisa@cedarlane.demo', passwordHash: password, firstName: 'Lisa', lastName: 'Park', emailVerified: true },
  });
  const james = await prisma.user.create({
    data: { email: 'james@northstar.demo', passwordHash: password, firstName: 'James', lastName: 'Wong', emailVerified: true },
  });

  // ── Workspace ──────────────────────────────────────────

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Northstar Advisory',
      slug: 'northstar-advisory',
      country: 'US',
      baseCurrency: 'USD',
    },
  });

  await prisma.workspaceSubscription.create({
    data: { workspaceId: workspace.id, plan: 'PROFESSIONAL', seats: 25, status: 'ACTIVE' },
  });

  // Workspace members
  await prisma.workspaceMember.create({ data: { userId: sarah.id, workspaceId: workspace.id, role: 'OWNER' } });
  await prisma.workspaceMember.create({ data: { userId: marcus.id, workspaceId: workspace.id, role: 'MEMBER' } });
  await prisma.workspaceMember.create({ data: { userId: lisa.id, workspaceId: workspace.id, role: 'MEMBER' } });
  await prisma.workspaceMember.create({ data: { userId: james.id, workspaceId: workspace.id, role: 'MEMBER' } });

  // ── Companies ──────────────────────────────────────────

  const now = new Date();
  const currentYear = now.getFullYear();

  const bluepeak = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'BluePeak Construction',
      legalName: 'BluePeak Construction LLC',
      country: 'US',
      baseCurrency: 'USD',
      fiscalYearStartMonth: 1,
      invoicePrefix: 'BPC-INV',
      billPrefix: 'BPC-BILL',
      nextInvoiceNum: 9,
      nextBillNum: 7,
      nextJournalNum: 25,
      nextPaymentNum: 6,
      nextExpenseNum: 5,
    },
  });

  const cedarlane = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Cedar Lane Retail',
      legalName: 'Cedar Lane Retail Inc.',
      country: 'US',
      baseCurrency: 'USD',
      fiscalYearStartMonth: 1,
      invoicePrefix: 'CLR-INV',
      billPrefix: 'CLR-BILL',
      nextInvoiceNum: 11,
      nextBillNum: 9,
      nextJournalNum: 30,
      nextPaymentNum: 7,
      nextExpenseNum: 4,
    },
  });

  const nova = await prisma.company.create({
    data: {
      workspaceId: workspace.id,
      name: 'Nova Health Services',
      legalName: 'Nova Health Services Corp.',
      country: 'US',
      baseCurrency: 'USD',
      fiscalYearStartMonth: 1,
      invoicePrefix: 'NHS-INV',
      billPrefix: 'NHS-BILL',
      nextInvoiceNum: 13,
      nextBillNum: 6,
      nextJournalNum: 28,
      nextPaymentNum: 8,
      nextExpenseNum: 7,
    },
  });

  // ── Company Users (RBAC) ───────────────────────────────

  // Sarah (Owner) gets access to all companies
  await prisma.companyUser.create({ data: { userId: sarah.id, companyId: bluepeak.id, role: 'COMPANY_ADMIN' } });
  await prisma.companyUser.create({ data: { userId: sarah.id, companyId: cedarlane.id, role: 'COMPANY_ADMIN' } });
  await prisma.companyUser.create({ data: { userId: sarah.id, companyId: nova.id, role: 'COMPANY_ADMIN' } });

  // Marcus (Accountant) - BluePeak + Nova, NOT Cedar Lane
  await prisma.companyUser.create({ data: { userId: marcus.id, companyId: bluepeak.id, role: 'ACCOUNTANT' } });
  await prisma.companyUser.create({ data: { userId: marcus.id, companyId: nova.id, role: 'ACCOUNTANT' } });

  // Lisa (Client Admin) - Cedar Lane ONLY
  await prisma.companyUser.create({ data: { userId: lisa.id, companyId: cedarlane.id, role: 'COMPANY_ADMIN' } });

  // James (Auditor) - All companies, read-only
  await prisma.companyUser.create({ data: { userId: james.id, companyId: bluepeak.id, role: 'READ_ONLY_AUDITOR' } });
  await prisma.companyUser.create({ data: { userId: james.id, companyId: cedarlane.id, role: 'READ_ONLY_AUDITOR' } });
  await prisma.companyUser.create({ data: { userId: james.id, companyId: nova.id, role: 'READ_ONLY_AUDITOR' } });

  // ── Seed each company ──────────────────────────────────

  for (const company of [bluepeak, cedarlane, nova]) {
    if (company.name.includes('Retail')) {
      await seedCedarLaneRetail(company, sarah.id);
    } else {
      await seedCompany(company, sarah.id, currentYear);
    }
  }

  // ── Verify Trial Balances ──────────────────────────────

  console.log('\n📊 Verifying Trial Balances...\n');
  for (const company of [bluepeak, cedarlane, nova]) {
    await verifyTrialBalance(company);
  }

  // ── Print Login Credentials ────────────────────────────

  console.log('\n' + '='.repeat(60));
  console.log('  🔐 SEEDED LOGIN CREDENTIALS');
  console.log('='.repeat(60));
  console.log('');
  console.log('  📧 sarah@northstar.demo  / Demo2024!  (Workspace Owner - all companies)');
  console.log('  📧 marcus@northstar.demo / Demo2024!  (Accountant - BluePeak + Nova only)');
  console.log('  📧 lisa@cedarlane.demo   / Demo2024!  (Client Admin - Cedar Lane only)');
  console.log('  📧 james@northstar.demo  / Demo2024!  (Read-Only Auditor - all companies)');
  console.log('');
  console.log('='.repeat(60));
  console.log('\n✅ Seed completed successfully!\n');
}

// ── Seed Cedar Lane Retail (Golden Books 2025) ────────────

async function seedCedarLaneRetail(company: any, ownerId: string) {
  console.log(`  📦 Seeding ${company.name} (Golden Spec 2025)...`);

  // Chart of Accounts
  const accounts: any[] = [];
  for (const acct of DEFAULT_COA) {
    const created = await prisma.account.create({
      data: {
        companyId: company.id,
        code: acct.code,
        name: acct.name,
        type: acct.type,
        subType: acct.subType,
        normalBalance: acct.normalBalance,
        isSystem: acct.isSystem,
        isContra: acct.isContra,
        systemTag: acct.systemTag || null,
      },
    });
    accounts.push(created);
  }

  // Tax Codes (Ontario CAD, HST 13%)
  const taxHST = await prisma.taxCode.create({
    data: { companyId: company.id, name: 'HST 13%', code: 'HST-13', rate: '0.1300', type: 'OUTPUT' },
  });
  const taxHSTInput = await prisma.taxCode.create({
    data: { companyId: company.id, name: 'HST 13% Input', code: 'HST-13-INPUT', rate: '0.1300', type: 'INPUT' },
  });
  await prisma.taxCode.create({
    data: { companyId: company.id, name: 'Tax Free', code: 'TAX-FREE', rate: '0.0000', type: 'NONE' },
  });

  // Fiscal Year + Periods (2025)
  const year = 2025;
  const fyStart = new Date(year, 0, 1);
  const fyEnd = new Date(year, 11, 31);
  const fy = await prisma.fiscalYear.create({
    data: { companyId: company.id, name: `FY ${year}`, startDate: fyStart, endDate: fyEnd, status: 'ACTIVE' },
  });
  for (let m = 0; m < 12; m++) {
    const pStart = new Date(year, m, 1);
    const pEnd = new Date(year, m + 1, 0);
    await prisma.fiscalPeriod.create({
      data: {
        fiscalYearId: fy.id,
        periodNumber: m + 1,
        name: pStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        startDate: pStart,
        endDate: pEnd,
        status: 'OPEN',
      },
    });
  }

  // Bank Account
  const checkingAccount = getAccountByCode(accounts, '1010');
  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      accountId: checkingAccount.id,
      name: `${company.name} Checking`,
      bankName: 'First National Bank',
      accountNumber: '****4521',
      currentBalance: '0',
    },
  });

  // Key accounts
  const arAccount = getAccount(accounts, 'AR');
  const apAccount = getAccount(accounts, 'AP');
  const taxPayable = getAccount(accounts, 'TAX_PAYABLE');
  const taxReceivable = getAccount(accounts, 'TAX_RECEIVABLE');
  const openingBalEq = getAccount(accounts, 'OPENING_BALANCE_EQUITY');
  const salesRevenue = getAccountByCode(accounts, '4000');
  const rentExpense = getAccountByCode(accounts, '6070');
  const bankFeesExpense = getAccount(accounts, 'BANK_FEES');
  const cogsAccount = getAccount(accounts, 'COGS');
  const inventoryAsset = getAccount(accounts, 'INVENTORY');
  const equipmentAccount = getAccountByCode(accounts, '1500');
  const bankLoan = getAccountByCode(accounts, '2500');

  let journalNum = 1;
  const jn = () => `JE-${String(journalNum++).padStart(4, '0')}`;

  // ── 1. Opening Balances (31 Dec 2024) ───────────────────
  await createJournal(
    company.id, jn(), new Date(year - 1, 11, 31),
    'Opening balances', 'OPENING_BALANCE', null, 'PRIMARY',
    [
      { accountId: checkingAccount.id, debit: d(50000), credit: d(0), description: 'Opening cash' },
      { accountId: inventoryAsset.id, debit: d(20000), credit: d(0), description: 'Opening inventory' },
      { accountId: equipmentAccount.id, debit: d(10000), credit: d(0), description: 'Opening equipment' },
      { accountId: apAccount.id, debit: d(0), credit: d(5000), description: 'Opening AP' },
      { accountId: bankLoan.id, debit: d(0), credit: d(15000), description: 'Opening bank loan' },
      { accountId: openingBalEq.id, debit: d(0), credit: d(60000), description: 'Opening balance equity' },
    ],
    ownerId,
  );

  // ── Customers & Vendors ─────────────────────────────────
  const customer = await prisma.customer.create({
    data: { companyId: company.id, name: 'Maple Creek Outfitters', email: 'maple@example.com', defaultTerms: 30 },
  });

  const vendor = await prisma.vendor.create({
    data: { companyId: company.id, name: 'Ontario Property Mgmt', email: 'rent@example.com', defaultTerms: 30 },
  });

  // ── T1: Sales Invoice ───────────────────────────────────
  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      number: 'INV-0001',
      date: new Date(year, 0, 15),
      dueDate: new Date(year, 1, 15),
      status: 'SENT',
      subtotal: d(1000),
      taxTotal: d(130),
      total: d(1130),
      amountPaid: d(0),
      amountDue: d(1130),
      terms: 30,
      lines: {
        create: [{
          accountId: salesRevenue.id,
          description: 'Sales of inventory goods',
          quantity: '1',
          unitPrice: d(1000),
          taxCodeId: taxHST.id,
          taxAmount: d(130),
          lineTotal: d(1000),
        }],
      },
    },
  });

  // Invoice Journals
  // Journal A: DR AR 1,130.00 · CR Revenue 1,000.00 · CR HST Payable 130.00
  const t1JE_A = await createJournal(
    company.id, jn(), new Date(year, 0, 15),
    `Invoice INV-0001 - ${customer.name}`,
    'INVOICE', invoice.id, 'PRIMARY',
    [
      { accountId: arAccount.id, debit: d(1130), credit: d(0), description: 'Invoice INV-0001', customerId: customer.id },
      { accountId: salesRevenue.id, debit: d(0), credit: d(1000), description: 'Product sales revenue' },
      { accountId: taxPayable.id, debit: d(0), credit: d(130), description: 'HST on sales' },
    ],
    ownerId,
  );
  // Journal B: DR COGS 600.00 · CR Inventory 600.00
  const t1JE_B = await createJournal(
    company.id, jn(), new Date(year, 0, 15),
    `COGS for Invoice INV-0001`,
    'INVOICE', invoice.id, 'COGS',
    [
      { accountId: cogsAccount.id, debit: d(600), credit: d(0), description: 'Cost of goods sold' },
      { accountId: inventoryAsset.id, debit: d(0), credit: d(600), description: 'Inventory reduction' },
    ],
    ownerId,
  );
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { journalEntryId: t1JE_A.id },
  });

  // ── T2: Customer Payment ────────────────────────────────
  const payment = await prisma.payment.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      bankAccountId: bankAccount.id,
      number: 'PAY-0001',
      date: new Date(year, 0, 20),
      amount: d(1130),
      reference: 'CHQ-20250120',
      notes: 'Payment in full',
      allocations: {
        create: [{ invoiceId: invoice.id, amount: d(1130) }],
      },
    },
  });

  const t2JE = await createJournal(
    company.id, jn(), new Date(year, 0, 20),
    `Payment PAY-0001 from ${customer.name}`,
    'PAYMENT', payment.id, 'PRIMARY',
    [
      { accountId: checkingAccount.id, debit: d(1130), credit: d(0), description: 'Payment receipt' },
      { accountId: arAccount.id, debit: d(0), credit: d(1130), description: 'Payment allocated to INV-0001', customerId: customer.id },
    ],
    ownerId,
  );
  await prisma.payment.update({
    where: { id: payment.id },
    data: { journalEntryId: t2JE.id },
  });
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaid: d(1130), amountDue: d(0), status: 'PAID', paidAt: new Date(year, 0, 20) },
  });

  // ── T3: Vendor Bill ─────────────────────────────────────
  const bill = await prisma.bill.create({
    data: {
      companyId: company.id,
      vendorId: vendor.id,
      number: 'BILL-0001',
      date: new Date(year, 0, 25),
      dueDate: new Date(year, 1, 25),
      status: 'PENDING',
      subtotal: d(2000),
      taxTotal: d(260),
      total: d(2260),
      amountPaid: d(0),
      amountDue: d(2260),
      terms: 30,
      lines: {
        create: [{
          accountId: rentExpense.id,
          description: 'Office Rent - Jan 2025',
          quantity: '1',
          unitPrice: d(2000),
          taxCodeId: taxHSTInput.id,
          taxAmount: d(260),
          lineTotal: d(2000),
        }],
      },
    },
  });

  const t3JE = await createJournal(
    company.id, jn(), new Date(year, 0, 25),
    `Bill BILL-0001 - ${vendor.name}`,
    'BILL', bill.id, 'PRIMARY',
    [
      { accountId: rentExpense.id, debit: d(2000), credit: d(0), description: 'Rent expense', vendorId: vendor.id },
      { accountId: taxReceivable.id, debit: d(260), credit: d(0), description: 'HST on rent' },
      { accountId: apAccount.id, debit: d(0), credit: d(2260), description: 'Rent payable', vendorId: vendor.id },
    ],
    ownerId,
  );
  await prisma.bill.update({
    where: { id: bill.id },
    data: { journalEntryId: t3JE.id },
  });

  // ── T4: Bill Payment ────────────────────────────────────
  const vpay = await prisma.vendorPayment.create({
    data: {
      companyId: company.id,
      vendorId: vendor.id,
      bankAccountId: bankAccount.id,
      number: 'VPAY-0001',
      date: new Date(year, 0, 28),
      amount: d(2260),
      reference: 'E-TRANSFER-RENT',
      notes: 'Rent payment',
      allocations: {
        create: [{ billId: bill.id, amount: d(2260) }],
      },
    },
  });

  const t4JE = await createJournal(
    company.id, jn(), new Date(year, 0, 28),
    `Vendor Payment VPAY-0001 to ${vendor.name}`,
    'VENDOR_PAYMENT', vpay.id, 'PRIMARY',
    [
      { accountId: apAccount.id, debit: d(2260), credit: d(0), description: 'AP debit', vendorId: vendor.id },
      { accountId: checkingAccount.id, debit: d(0), credit: d(2260), description: 'E-transfer payment' },
    ],
    ownerId,
  );
  await prisma.vendorPayment.update({
    where: { id: vpay.id },
    data: { journalEntryId: t4JE.id },
  });
  await prisma.bill.update({
    where: { id: bill.id },
    data: { amountPaid: d(2260), amountDue: d(0), status: 'PAID' },
  });

  // ── T5: Bank Fee ────────────────────────────────────────
  const expense = await prisma.expense.create({
    data: {
      companyId: company.id,
      accountId: bankFeesExpense.id,
      bankAccountId: bankAccount.id,
      number: 'EXP-0001',
      date: new Date(year, 0, 31),
      amount: d(50),
      description: 'Monthly service fee',
    },
  });

  const t5JE = await createJournal(
    company.id, jn(), new Date(year, 0, 31),
    `Expense EXP-0001 - Monthly service fee`,
    'EXPENSE', expense.id, 'PRIMARY',
    [
      { accountId: bankFeesExpense.id, debit: d(50), credit: d(0), description: 'Service fee' },
      { accountId: checkingAccount.id, debit: d(0), credit: d(50), description: 'Monthly fee debit' },
    ],
    ownerId,
  );
  await prisma.expense.update({
    where: { id: expense.id },
    data: { journalEntryId: t5JE.id },
  });

  // Update bank account balance (50000 + 1130 - 2260 - 50 = 48820)
  await prisma.bankAccount.update({
    where: { id: bankAccount.id },
    data: { currentBalance: d(48820) },
  });

  // ── Bank Transactions ───────────────────────────────────
  const bankTxns = [
    { date: new Date(year, 0, 20), desc: 'CHQ-20250120 Deposit', amount: 1130, status: 'RECONCILED', isReconciled: true },
    { date: new Date(year, 0, 28), desc: 'E-TRANSFER-RENT Payment', amount: -2260, status: 'RECONCILED', isReconciled: true },
    { date: new Date(year, 0, 31), desc: 'Monthly Service Fee', amount: -50, status: 'RECONCILED', isReconciled: true },
  ];
  for (const txn of bankTxns) {
    await prisma.bankTransaction.create({
      data: {
        bankAccountId: bankAccount.id,
        date: txn.date,
        description: txn.desc,
        amount: d(txn.amount),
        type: txn.amount >= 0 ? 'CREDIT' : 'DEBIT',
        status: txn.status,
        isReconciled: txn.isReconciled,
      },
    });
  }

  // ── Workflow Rule ───────────────────────────────────────
  await prisma.workflowRule.create({
    data: {
      companyId: company.id,
      name: 'Overdue Invoice Reminder',
      trigger: 'INVOICE_OVERDUE',
      conditions: { daysOverdue: 7 },
      actions: [{ type: 'SEND_REMINDER', template: 'overdue_invoice' }],
      isActive: true,
    },
  });

  console.log(`  ✅ ${company.name} (Golden Spec 2025) seeded`);
}

// ── Seed a single company ─────────────────────────────────

async function seedCompany(company: any, ownerId: string, year: number) {
  console.log(`  📦 Seeding ${company.name}...`);
  const now = new Date();

  // Chart of Accounts
  const accounts: any[] = [];
  for (const acct of DEFAULT_COA) {
    const created = await prisma.account.create({
      data: {
        companyId: company.id,
        code: acct.code,
        name: acct.name,
        type: acct.type,
        subType: acct.subType,
        normalBalance: acct.normalBalance,
        isSystem: acct.isSystem,
        isContra: acct.isContra,
        systemTag: acct.systemTag || null,
      },
    });
    accounts.push(created);
  }

  // Tax Codes
  const taxGST = await prisma.taxCode.create({
    data: { companyId: company.id, name: 'GST 10%', code: 'GST', rate: '0.1000', type: 'OUTPUT' },
  });
  const taxFree = await prisma.taxCode.create({
    data: { companyId: company.id, name: 'Tax Free', code: 'TAX-FREE', rate: '0.0000', type: 'NONE' },
  });

  // Fiscal Year + Periods
  const fyStart = new Date(year, 0, 1);
  const fyEnd = new Date(year, 11, 31);
  const fy = await prisma.fiscalYear.create({
    data: { companyId: company.id, name: `FY ${year}`, startDate: fyStart, endDate: fyEnd, status: 'ACTIVE' },
  });
  for (let m = 0; m < 12; m++) {
    const pStart = new Date(year, m, 1);
    const pEnd = new Date(year, m + 1, 0);
    await prisma.fiscalPeriod.create({
      data: {
        fiscalYearId: fy.id,
        periodNumber: m + 1,
        name: pStart.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        startDate: pStart,
        endDate: pEnd,
        status: 'OPEN',
      },
    });
  }

  // Bank Account
  const checkingAccount = getAccountByCode(accounts, '1010');
  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      accountId: checkingAccount.id,
      name: `${company.name} Checking`,
      bankName: 'First National Bank',
      accountNumber: '****4521',
      currentBalance: '0',
    },
  });

  // Key accounts
  const arAccount = getAccount(accounts, 'AR');
  const apAccount = getAccount(accounts, 'AP');
  const taxPayable = getAccount(accounts, 'TAX_PAYABLE');
  const taxReceivable = getAccount(accounts, 'TAX_RECEIVABLE');
  const openingBalEq = getAccount(accounts, 'OPENING_BALANCE_EQUITY');
  const salesRevenue = getAccountByCode(accounts, '4000');
  const serviceRevenue = getAccountByCode(accounts, '4010');
  const projectRevenue = getAccountByCode(accounts, '4020');
  const rentExpense = getAccountByCode(accounts, '6070');
  const utilitiesExpense = getAccountByCode(accounts, '6120');
  const officeSupplies = getAccountByCode(accounts, '6060');
  const softwareExpense = getAccountByCode(accounts, '6090');
  const insuranceExpense = getAccountByCode(accounts, '6040');
  const bankFeesExpense = getAccount(accounts, 'BANK_FEES');
  const ownersEquity = getAccountByCode(accounts, '3000');

  const revenueAccount = company.name.includes('Construction') ? projectRevenue :
                          company.name.includes('Retail') ? salesRevenue : serviceRevenue;

  let journalNum = 1;
  const jn = () => `JE-${String(journalNum++).padStart(4, '0')}`;

  // ── Opening Balances ────────────────────────────────────

  // Post opening balances: Cash + Equipment = Owner's Equity + Opening Balance
  const openingCash = company.name.includes('Construction') ? 85000 :
                      company.name.includes('Retail') ? 65000 : 45000;
  const openingEquipment = company.name.includes('Construction') ? 35000 :
                           company.name.includes('Retail') ? 15000 : 10000;
  const ownersEqAmount = openingCash + openingEquipment;
  const equipmentAccount = getAccountByCode(accounts, '1500');

  await createJournal(
    company.id, jn(), new Date(year - 1, 11, 31),
    'Opening balances', 'OPENING_BALANCE', null, 'PRIMARY',
    [
      { accountId: checkingAccount.id, debit: d(openingCash), credit: d(0), description: 'Opening cash balance' },
      { accountId: equipmentAccount.id, debit: d(openingEquipment), credit: d(0), description: 'Opening equipment' },
      { accountId: ownersEquity.id, debit: d(0), credit: d(ownersEqAmount), description: "Owner's investment" },
    ],
    ownerId,
  );
  await prisma.bankAccount.update({ where: { id: bankAccount.id }, data: { currentBalance: d(openingCash) } });

  // ── Customers ───────────────────────────────────────────

  const customerNames = company.name.includes('Construction')
    ? ['Meridian Properties', 'Greenfield Developments', 'Summit Real Estate', 'Pacific Heights LLC', 'Harbor View Homes']
    : company.name.includes('Retail')
    ? ['Downtown Gift Shop', 'Mountain View Market', 'Lakeside Boutique', 'Sunrise General Store', 'Valley Home Goods', 'Coastal Decor Co']
    : ['Sunrise Medical Center', 'Valley Health Clinic', 'Bayview Family Practice', 'Lakewood Wellness Center', 'Metro Health Group', 'Riverdale Hospital', 'Eastside Physical Therapy', 'Westpark Dental'];

  const customers: any[] = [];
  for (const name of customerNames) {
    const c = await prisma.customer.create({
      data: { companyId: company.id, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, defaultTerms: 30 },
    });
    customers.push(c);
  }

  // ── Vendors ─────────────────────────────────────────────

  const vendorNames = company.name.includes('Construction')
    ? ['BuildPro Supplies', 'Heavy Equipment Rentals', 'Concrete Masters', 'Electrical Solutions']
    : company.name.includes('Retail')
    ? ['Wholesale Distributors Inc', 'Pacific Imports', 'Metro Packaging', 'Fresh Supply Co', 'Digital Marketing Pro']
    : ['Medical Supply Direct', 'HealthTech Solutions', 'CleanCare Products'];

  const vendors: any[] = [];
  for (const name of vendorNames) {
    const v = await prisma.vendor.create({
      data: { companyId: company.id, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`, defaultTerms: 30 },
    });
    vendors.push(v);
  }

  // ── Invoices ────────────────────────────────────────────

  const invoiceConfigs = [
    { cIdx: 0, date: subDays(now, 90), amount: 12500, status: 'PAID', paid: true },
    { cIdx: 1, date: subDays(now, 75), amount: 8750, status: 'PAID', paid: true },
    { cIdx: 2, date: subDays(now, 60), amount: 15000, status: 'PAID', paid: true },
    { cIdx: 0, date: subDays(now, 45), amount: 22000, status: 'PARTIALLY_PAID', paid: false, partialPaid: 10000 },
    { cIdx: 3, date: subDays(now, 40), amount: 6500, status: 'PARTIALLY_PAID', paid: false, partialPaid: 3000 },
    { cIdx: 1, date: subDays(now, 50), amount: 9800, status: 'OVERDUE', paid: false },
    { cIdx: 4 % customers.length, date: subDays(now, 45), amount: 11200, status: 'OVERDUE', paid: false },
    { cIdx: 2, date: subDays(now, 35), amount: 7500, status: 'OVERDUE', paid: false },
  ];

  let invNum = 1;
  let payNum = 1;
  let currentBankBalance = new Decimal(openingCash);

  for (const cfg of invoiceConfigs) {
    const customer = customers[cfg.cIdx];
    const invoiceNumber = `${company.invoicePrefix}-${String(invNum++).padStart(4, '0')}`;
    const netAmount = cfg.amount;
    const taxAmount = Math.round(netAmount * 0.1 * 100) / 100;
    const totalAmount = netAmount + taxAmount;
    const dueDate = addDays(cfg.date, 30);

    let amountPaid = 0;
    let amountDue = totalAmount;

    if (cfg.status === 'PAID') {
      amountPaid = totalAmount;
      amountDue = 0;
    } else if (cfg.status === 'PARTIALLY_PAID' && cfg.partialPaid) {
      amountPaid = cfg.partialPaid;
      amountDue = totalAmount - cfg.partialPaid;
    }

    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        number: invoiceNumber,
        date: cfg.date,
        dueDate,
        status: cfg.status,
        subtotal: d(netAmount),
        taxTotal: d(taxAmount),
        total: d(totalAmount),
        amountPaid: d(amountPaid),
        amountDue: d(amountDue),
        terms: 30,
        paidAt: cfg.status === 'PAID' ? addDays(cfg.date, 15) : undefined,
        lines: {
          create: [{
            accountId: revenueAccount.id,
            description: `${company.name.includes('Construction') ? 'Construction services' : company.name.includes('Retail') ? 'Product sales' : 'Healthcare services'}`,
            quantity: '1',
            unitPrice: d(netAmount),
            taxCodeId: taxGST.id,
            taxAmount: d(taxAmount),
            lineTotal: d(netAmount),
          }],
        },
      },
    });

    // Post invoice journal: DR AR, CR Revenue, CR Tax Payable
    const invoiceJE = await createJournal(
      company.id, jn(), cfg.date,
      `Invoice ${invoiceNumber} - ${customer.name}`,
      'INVOICE', invoice.id, 'PRIMARY',
      [
        { accountId: arAccount.id, debit: d(totalAmount), credit: d(0), description: `Invoice ${invoiceNumber}`, customerId: customer.id },
        { accountId: revenueAccount.id, debit: d(0), credit: d(netAmount), description: `Revenue - ${invoiceNumber}` },
        { accountId: taxPayable.id, debit: d(0), credit: d(taxAmount), description: `GST on ${invoiceNumber}` },
      ],
      ownerId,
    );
    await prisma.invoice.update({ where: { id: invoice.id }, data: { journalEntryId: invoiceJE.id } });

    // Post payments
    if (amountPaid > 0) {
      const paymentDate = addDays(cfg.date, 15);
      const paymentNumber = `PAY-${String(payNum++).padStart(4, '0')}`;

      const payment = await prisma.payment.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          bankAccountId: bankAccount.id,
          number: paymentNumber,
          date: paymentDate,
          amount: d(amountPaid),
          reference: `Payment for ${invoiceNumber}`,
          allocations: {
            create: [{ invoiceId: invoice.id, amount: d(amountPaid) }],
          },
        },
      });

      // Post payment journal: DR Bank, CR AR
      const paymentJE = await createJournal(
        company.id, jn(), paymentDate,
        `Payment ${paymentNumber} from ${customer.name}`,
        'PAYMENT', payment.id, 'PRIMARY',
        [
          { accountId: checkingAccount.id, debit: d(amountPaid), credit: d(0), description: `Payment ${paymentNumber}` },
          { accountId: arAccount.id, debit: d(0), credit: d(amountPaid), description: `Payment on ${invoiceNumber}`, customerId: customer.id },
        ],
        ownerId,
      );
      await prisma.payment.update({ where: { id: payment.id }, data: { journalEntryId: paymentJE.id } });
      currentBankBalance = currentBankBalance.plus(amountPaid);
    }
  }

  // ── Bills ───────────────────────────────────────────────

  const billConfigs = [
    { vIdx: 0, date: subDays(now, 80), amount: 5500, expCode: '6070', status: 'PAID', paid: true },
    { vIdx: 1, date: subDays(now, 65), amount: 3200, expCode: '6080', status: 'PAID', paid: true },
    { vIdx: 2 % vendors.length, date: subDays(now, 50), amount: 4800, expCode: '6060', status: 'PAID', paid: true },
    { vIdx: 0, date: subDays(now, 30), amount: 7200, expCode: '6070', status: 'PENDING', paid: false },
    { vIdx: 1, date: subDays(now, 25), amount: 2900, expCode: '6090', status: 'PENDING', paid: false },
    { vIdx: 3 % vendors.length, date: subDays(now, 20), amount: 6100, expCode: '6040', status: 'PENDING', paid: false },
  ];

  let billNum = 1;
  let vpayNum = 1;

  for (const cfg of billConfigs) {
    const vendor = vendors[cfg.vIdx];
    const billNumber = `${company.billPrefix}-${String(billNum++).padStart(4, '0')}`;
    const expenseAccount = getAccountByCode(accounts, cfg.expCode);
    const netAmount = cfg.amount;
    const taxAmount = Math.round(netAmount * 0.1 * 100) / 100;
    const totalAmount = netAmount + taxAmount;
    const dueDate = addDays(cfg.date, 30);

    let amountPaid = 0;
    let amountDue = totalAmount;
    if (cfg.paid) {
      amountPaid = totalAmount;
      amountDue = 0;
    }

    const bill = await prisma.bill.create({
      data: {
        companyId: company.id,
        vendorId: vendor.id,
        number: billNumber,
        date: cfg.date,
        dueDate,
        status: cfg.status,
        subtotal: d(netAmount),
        taxTotal: d(taxAmount),
        total: d(totalAmount),
        amountPaid: d(amountPaid),
        amountDue: d(amountDue),
        terms: 30,
        lines: {
          create: [{
            accountId: expenseAccount.id,
            description: `${expenseAccount.name} - ${vendor.name}`,
            quantity: '1',
            unitPrice: d(netAmount),
            taxCodeId: taxGST.id,
            taxAmount: d(taxAmount),
            lineTotal: d(netAmount),
          }],
        },
      },
    });

    // Post bill journal: DR Expense, DR Tax Receivable, CR AP
    const billJE = await createJournal(
      company.id, jn(), cfg.date,
      `Bill ${billNumber} - ${vendor.name}`,
      'BILL', bill.id, 'PRIMARY',
      [
        { accountId: expenseAccount.id, debit: d(netAmount), credit: d(0), description: `${expenseAccount.name}`, vendorId: vendor.id },
        { accountId: taxReceivable.id, debit: d(taxAmount), credit: d(0), description: `Input tax on ${billNumber}` },
        { accountId: apAccount.id, debit: d(0), credit: d(totalAmount), description: `Bill ${billNumber}`, vendorId: vendor.id },
      ],
      ownerId,
    );
    await prisma.bill.update({ where: { id: bill.id }, data: { journalEntryId: billJE.id } });

    // Pay bills
    if (cfg.paid) {
      const payDate = addDays(cfg.date, 20);
      const vpayNumber = `VPAY-${String(vpayNum++).padStart(4, '0')}`;

      const vpay = await prisma.vendorPayment.create({
        data: {
          companyId: company.id,
          vendorId: vendor.id,
          bankAccountId: bankAccount.id,
          number: vpayNumber,
          date: payDate,
          amount: d(totalAmount),
          reference: `Payment for ${billNumber}`,
          allocations: {
            create: [{ billId: bill.id, amount: d(totalAmount) }],
          },
        },
      });

      // Post vendor payment: DR AP, CR Bank
      const vpayJE = await createJournal(
        company.id, jn(), payDate,
        `Vendor Payment ${vpayNumber} to ${vendor.name}`,
        'VENDOR_PAYMENT', vpay.id, 'PRIMARY',
        [
          { accountId: apAccount.id, debit: d(totalAmount), credit: d(0), description: `Payment ${vpayNumber}`, vendorId: vendor.id },
          { accountId: checkingAccount.id, debit: d(0), credit: d(totalAmount), description: `Payment to ${vendor.name}` },
        ],
        ownerId,
      );
      await prisma.vendorPayment.update({ where: { id: vpay.id }, data: { journalEntryId: vpayJE.id } });
      currentBankBalance = currentBankBalance.minus(totalAmount);
    }
  }

  // ── Expenses ────────────────────────────────────────────

  const expenseConfigs = [
    { code: '6090', amount: 299, date: subDays(now, 60), desc: 'Accounting software subscription' },
    { code: '6100', amount: 189, date: subDays(now, 45), desc: 'Monthly internet service' },
    { code: '6120', amount: 425, date: subDays(now, 30), desc: 'Monthly utilities' },
    { code: '6060', amount: 156, date: subDays(now, 15), desc: 'Office supplies purchase' },
  ];

  let expNum = 1;
  for (const cfg of expenseConfigs) {
    const expAccount = getAccountByCode(accounts, cfg.code);
    const expNumber = `EXP-${String(expNum++).padStart(4, '0')}`;

    const expense = await prisma.expense.create({
      data: {
        companyId: company.id,
        accountId: expAccount.id,
        bankAccountId: bankAccount.id,
        number: expNumber,
        date: cfg.date,
        amount: d(cfg.amount),
        description: cfg.desc,
      },
    });

    // Post expense journal: DR Expense, CR Bank
    const expJE = await createJournal(
      company.id, jn(), cfg.date,
      `Expense ${expNumber} - ${cfg.desc}`,
      'EXPENSE', expense.id, 'PRIMARY',
      [
        { accountId: expAccount.id, debit: d(cfg.amount), credit: d(0), description: cfg.desc },
        { accountId: checkingAccount.id, debit: d(0), credit: d(cfg.amount), description: `Expense ${expNumber}` },
      ],
      ownerId,
    );
    await prisma.expense.update({ where: { id: expense.id }, data: { journalEntryId: expJE.id } });
    currentBankBalance = currentBankBalance.minus(cfg.amount);
  }

  // Update final bank balance
  await prisma.bankAccount.update({
    where: { id: bankAccount.id },
    data: { currentBalance: currentBankBalance.toFixed(4) },
  });

  // ── Bank Transactions ───────────────────────────────────

  // Simulate imported bank transactions (mix of matched/reconciled/inbox)
  const bankTxns = [
    { date: subDays(now, 70), desc: 'ATM Withdrawal', amount: -200, status: 'RECONCILED', isReconciled: true },
    { date: subDays(now, 55), desc: 'Wire Transfer In', amount: 5000, status: 'RECONCILED', isReconciled: true },
    { date: subDays(now, 50), desc: 'POS Purchase - Office Depot', amount: -87.50, status: 'RECONCILED', isReconciled: true },
    { date: subDays(now, 45), desc: 'ACH Credit - Client Payment', amount: 3500, status: 'RECONCILED', isReconciled: true },
    { date: subDays(now, 35), desc: 'Check Deposit', amount: 2800, status: 'MATCHED' },
    { date: subDays(now, 30), desc: 'Debit Card - Amazon', amount: -156.99, status: 'MATCHED' },
    { date: subDays(now, 25), desc: 'Monthly Service Fee', amount: -15, status: 'CATEGORIZED' },
    { date: subDays(now, 20), desc: 'Wire Transfer In', amount: 8500, status: 'CATEGORIZED' },
    { date: subDays(now, 10), desc: 'Unknown Deposit', amount: 1250, status: 'IMPORTED' },
    { date: subDays(now, 8), desc: 'Debit Card Purchase', amount: -342.50, status: 'IMPORTED' },
    { date: subDays(now, 5), desc: 'Direct Deposit - Client', amount: 6750, status: 'IMPORTED' },
    { date: subDays(now, 3), desc: 'Transfer Out', amount: -2000, status: 'IMPORTED' },
  ];

  for (const txn of bankTxns) {
    await prisma.bankTransaction.create({
      data: {
        bankAccountId: bankAccount.id,
        date: txn.date,
        description: txn.desc,
        amount: d(txn.amount),
        type: txn.amount >= 0 ? 'CREDIT' : 'DEBIT',
        status: txn.status,
        isReconciled: txn.isReconciled || false,
      },
    });
  }

  // ── Workflow Rule (overdue invoice reminder) ────────────

  await prisma.workflowRule.create({
    data: {
      companyId: company.id,
      name: 'Overdue Invoice Reminder',
      trigger: 'INVOICE_OVERDUE',
      conditions: { daysOverdue: 7 },
      actions: [{ type: 'SEND_REMINDER', template: 'overdue_invoice' }],
      isActive: true,
    },
  });

  // Approval request for a pending high-value bill
  const highValueBill = await prisma.bill.findFirst({
    where: { companyId: company.id, status: 'PENDING' },
    orderBy: { total: 'desc' },
  });
  if (highValueBill) {
    await prisma.approvalRequest.create({
      data: {
        companyId: company.id,
        entityType: 'BILL',
        entityId: highValueBill.id,
        requestedBy: ownerId,
        status: 'PENDING',
        threshold: d(5000),
        notes: `Bill ${highValueBill.number} exceeds $5,000 approval threshold`,
      },
    });
  }

  console.log(`  ✅ ${company.name} seeded`);
}

// ── Verify Trial Balance ──────────────────────────────────

async function verifyTrialBalance(company: any) {
  const result = await prisma.$queryRaw<{ total_debits: any; total_credits: any }[]>`
    SELECT
      COALESCE(SUM(jl.debit), 0) as total_debits,
      COALESCE(SUM(jl.credit), 0) as total_credits
    FROM journal_lines jl
    JOIN journal_entries je ON jl."journalEntryId" = je.id
    WHERE je."companyId" = ${company.id}
      AND je."isPosted" = true
      AND je."isVoided" = false
  `;

  const debits = new Decimal(result[0].total_debits.toString());
  const credits = new Decimal(result[0].total_credits.toString());
  const isBalanced = debits.equals(credits);

  if (isBalanced) {
    console.log(`  ✅ ${company.name}: Trial Balance BALANCED (Debits: $${debits.toFixed(2)}, Credits: $${credits.toFixed(2)})`);
  } else {
    console.log(`  ❌ ${company.name}: Trial Balance UNBALANCED! Debits: $${debits.toFixed(2)}, Credits: $${credits.toFixed(2)}, Diff: $${debits.minus(credits).toFixed(2)}`);
    throw new Error(`Trial balance for ${company.name} does not balance!`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// ============================================================
// LedgerFlow — Default Chart of Accounts Template
// Seeded for each new company on creation
// ============================================================

import { AccountType, AccountSubType, NormalBalance } from './enums';

export interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
  subType: AccountSubType;
  normalBalance: NormalBalance;
  isSystem: boolean;
  isContra: boolean;
  description?: string;
  /** Tag for lookup during posting (e.g., 'AR', 'AP', 'RETAINED_EARNINGS') */
  systemTag?: string;
}

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  // ── ASSETS ────────────────────────────────────────────────

  // Cash & Bank
  { code: '1000', name: 'Petty Cash', type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1010', name: 'Business Checking Account', type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1020', name: 'Business Savings Account', type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1050', name: 'Undeposited Funds', type: AccountType.ASSET, subType: AccountSubType.CASH_AND_BANK, normalBalance: NormalBalance.DEBIT, isSystem: true, isContra: false, systemTag: 'UNDEPOSITED_FUNDS' },

  // Accounts Receivable
  { code: '1100', name: 'Accounts Receivable', type: AccountType.ASSET, subType: AccountSubType.ACCOUNTS_RECEIVABLE, normalBalance: NormalBalance.DEBIT, isSystem: true, isContra: false, systemTag: 'AR' },

  // Current Assets
  { code: '1200', name: 'Prepaid Expenses', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1210', name: 'Employee Advances', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1250', name: 'Input Tax / Tax Receivable', type: AccountType.ASSET, subType: AccountSubType.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true, isContra: false, systemTag: 'TAX_RECEIVABLE' },

  // Inventory
  { code: '1300', name: 'Inventory Asset', type: AccountType.ASSET, subType: AccountSubType.INVENTORY, normalBalance: NormalBalance.DEBIT, isSystem: true, isContra: false, systemTag: 'INVENTORY' },
  { code: '1310', name: 'Goods Received Not Invoiced', type: AccountType.ASSET, subType: AccountSubType.INVENTORY, normalBalance: NormalBalance.DEBIT, isSystem: true, isContra: false, systemTag: 'GRNI' },

  // Fixed Assets
  { code: '1500', name: 'Furniture & Equipment', type: AccountType.ASSET, subType: AccountSubType.FIXED_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1510', name: 'Vehicles', type: AccountType.ASSET, subType: AccountSubType.FIXED_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1520', name: 'Computer Equipment', type: AccountType.ASSET, subType: AccountSubType.FIXED_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1550', name: 'Leasehold Improvements', type: AccountType.ASSET, subType: AccountSubType.FIXED_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '1600', name: 'Accumulated Depreciation', type: AccountType.ASSET, subType: AccountSubType.FIXED_ASSET, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: true, systemTag: 'ACCUM_DEPRECIATION' },

  // ── LIABILITIES ──────────────────────────────────────────

  // Accounts Payable
  { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY, subType: AccountSubType.ACCOUNTS_PAYABLE, normalBalance: NormalBalance.CREDIT, isSystem: true, isContra: false, systemTag: 'AP' },

  // Current Liabilities
  { code: '2100', name: 'Sales Tax Payable', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: true, isContra: false, systemTag: 'TAX_PAYABLE' },
  { code: '2110', name: 'Payroll Tax Payable', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2120', name: 'Employee Benefits Payable', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2130', name: 'Wages Payable', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2150', name: 'Accrued Liabilities', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2160', name: 'Employee Reimbursement Payable', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2170', name: 'Unearned Revenue', type: AccountType.LIABILITY, subType: AccountSubType.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },

  // Credit Card
  { code: '2200', name: 'Credit Card Payable', type: AccountType.LIABILITY, subType: AccountSubType.CREDIT_CARD, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false, systemTag: 'CREDIT_CARD' },

  // Long-term Liabilities
  { code: '2500', name: 'Bank Loan', type: AccountType.LIABILITY, subType: AccountSubType.LONG_TERM_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '2510', name: 'Mortgage Payable', type: AccountType.LIABILITY, subType: AccountSubType.LONG_TERM_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },

  // ── EQUITY ───────────────────────────────────────────────

  { code: '3000', name: 'Owner\'s Equity / Share Capital', type: AccountType.EQUITY, subType: AccountSubType.OWNERS_EQUITY, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '3100', name: 'Owner\'s Draws', type: AccountType.EQUITY, subType: AccountSubType.OWNERS_EQUITY, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: true },
  { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, subType: AccountSubType.RETAINED_EARNINGS, normalBalance: NormalBalance.CREDIT, isSystem: true, isContra: false, systemTag: 'RETAINED_EARNINGS' },
  { code: '3300', name: 'Opening Balance Equity', type: AccountType.EQUITY, subType: AccountSubType.OPENING_BALANCE, normalBalance: NormalBalance.CREDIT, isSystem: true, isContra: false, systemTag: 'OPENING_BALANCE_EQUITY' },

  // ── INCOME ───────────────────────────────────────────────

  { code: '4000', name: 'Sales Revenue', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4010', name: 'Service Revenue', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4020', name: 'Project Revenue', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4050', name: 'Sales Discounts', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: true },
  { code: '4060', name: 'Sales Returns & Allowances', type: AccountType.INCOME, subType: AccountSubType.SALES_REVENUE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: true },

  // Other Income
  { code: '4500', name: 'Interest Income', type: AccountType.INCOME, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4510', name: 'Other Income', type: AccountType.INCOME, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4520', name: 'Realized FX Gain', type: AccountType.INCOME, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false, systemTag: 'FX_GAIN' },
  { code: '4530', name: 'Unrealized FX Gain', type: AccountType.INCOME, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },
  { code: '4540', name: 'Gain on Asset Disposal', type: AccountType.INCOME, subType: AccountSubType.OTHER_INCOME, normalBalance: NormalBalance.CREDIT, isSystem: false, isContra: false },

  // ── EXPENSES ─────────────────────────────────────────────

  // COGS
  { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'COGS' },
  { code: '5010', name: 'Cost of Services', type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '5050', name: 'Inventory Adjustment', type: AccountType.EXPENSE, subType: AccountSubType.COST_OF_GOODS_SOLD, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'INVENTORY_ADJUSTMENT' },

  // Operating Expenses
  { code: '6000', name: 'Advertising & Marketing', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6010', name: 'Automobile Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6020', name: 'Bank Fees & Charges', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'BANK_FEES' },
  { code: '6030', name: 'Depreciation Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'DEPRECIATION' },
  { code: '6040', name: 'Insurance', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6050', name: 'Legal & Professional Fees', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6060', name: 'Office Supplies', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6070', name: 'Rent Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6080', name: 'Repairs & Maintenance', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6090', name: 'Software & Subscriptions', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6100', name: 'Telephone & Internet', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6110', name: 'Travel Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6120', name: 'Utilities', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6130', name: 'Meals & Entertainment', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6140', name: 'Postage & Shipping', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6150', name: 'Training & Education', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6160', name: 'Miscellaneous Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },

  // Bad Debt
  { code: '6200', name: 'Bad Debt Expense', type: AccountType.EXPENSE, subType: AccountSubType.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'BAD_DEBT' },

  // Payroll
  { code: '6300', name: 'Wages & Salaries', type: AccountType.EXPENSE, subType: AccountSubType.PAYROLL_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6310', name: 'Employer Payroll Taxes', type: AccountType.EXPENSE, subType: AccountSubType.PAYROLL_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6320', name: 'Employee Benefits', type: AccountType.EXPENSE, subType: AccountSubType.PAYROLL_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6330', name: 'Contract Labor', type: AccountType.EXPENSE, subType: AccountSubType.PAYROLL_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },

  // Other Expenses
  { code: '6500', name: 'FX Loss', type: AccountType.EXPENSE, subType: AccountSubType.OTHER_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'FX_LOSS' },
  { code: '6510', name: 'Loss on Asset Disposal', type: AccountType.EXPENSE, subType: AccountSubType.OTHER_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6520', name: 'Penalties & Fines', type: AccountType.EXPENSE, subType: AccountSubType.OTHER_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false },
  { code: '6600', name: 'Rounding Adjustment', type: AccountType.EXPENSE, subType: AccountSubType.OTHER_EXPENSE, normalBalance: NormalBalance.DEBIT, isSystem: false, isContra: false, systemTag: 'ROUNDING' },
];

/** System account tags used by the posting engine to find control accounts */
export const SYSTEM_ACCOUNT_TAGS = {
  AR: 'AR',
  AP: 'AP',
  TAX_PAYABLE: 'TAX_PAYABLE',
  TAX_RECEIVABLE: 'TAX_RECEIVABLE',
  INVENTORY: 'INVENTORY',
  GRNI: 'GRNI',
  COGS: 'COGS',
  RETAINED_EARNINGS: 'RETAINED_EARNINGS',
  OPENING_BALANCE_EQUITY: 'OPENING_BALANCE_EQUITY',
  UNDEPOSITED_FUNDS: 'UNDEPOSITED_FUNDS',
  BANK_FEES: 'BANK_FEES',
  ACCUM_DEPRECIATION: 'ACCUM_DEPRECIATION',
  DEPRECIATION: 'DEPRECIATION',
  FX_GAIN: 'FX_GAIN',
  FX_LOSS: 'FX_LOSS',
  BAD_DEBT: 'BAD_DEBT',
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
  ROUNDING: 'ROUNDING',
  CREDIT_CARD: 'CREDIT_CARD',
} as const;

/** Control accounts that cannot be posted to manually */
export const CONTROL_ACCOUNT_TAGS = new Set([
  SYSTEM_ACCOUNT_TAGS.AR,
  SYSTEM_ACCOUNT_TAGS.AP,
  SYSTEM_ACCOUNT_TAGS.TAX_PAYABLE,
  SYSTEM_ACCOUNT_TAGS.TAX_RECEIVABLE,
  SYSTEM_ACCOUNT_TAGS.INVENTORY,
  SYSTEM_ACCOUNT_TAGS.GRNI,
  SYSTEM_ACCOUNT_TAGS.RETAINED_EARNINGS,
  SYSTEM_ACCOUNT_TAGS.OPENING_BALANCE_EQUITY,
]);

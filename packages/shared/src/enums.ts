// ============================================================
// LedgerFlow Shared Enums
// Central source of truth for all enumeration types
// ============================================================

// ── Account Types ──────────────────────────────────────────

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubType {
  // Assets
  CASH_AND_BANK = 'CASH_AND_BANK',
  ACCOUNTS_RECEIVABLE = 'ACCOUNTS_RECEIVABLE',
  CURRENT_ASSET = 'CURRENT_ASSET',
  INVENTORY = 'INVENTORY',
  FIXED_ASSET = 'FIXED_ASSET',
  OTHER_ASSET = 'OTHER_ASSET',
  // Liabilities
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER_LIABILITY = 'OTHER_LIABILITY',
  // Equity
  OWNERS_EQUITY = 'OWNERS_EQUITY',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  OPENING_BALANCE = 'OPENING_BALANCE',
  OTHER_EQUITY = 'OTHER_EQUITY',
  // Income
  SALES_REVENUE = 'SALES_REVENUE',
  OTHER_INCOME = 'OTHER_INCOME',
  // Expenses
  COST_OF_GOODS_SOLD = 'COST_OF_GOODS_SOLD',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  PAYROLL_EXPENSE = 'PAYROLL_EXPENSE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

// ── Document & Transaction Types ───────────────────────────

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
  CANCELLED = 'CANCELLED',
}

export enum JournalSourceType {
  MANUAL = 'MANUAL',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  BILL = 'BILL',
  VENDOR_PAYMENT = 'VENDOR_PAYMENT',
  VENDOR_CREDIT = 'VENDOR_CREDIT',
  EXPENSE = 'EXPENSE',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BANK_FEE = 'BANK_FEE',
  BANK_INTEREST = 'BANK_INTEREST',
  INVENTORY_ADJUSTMENT = 'INVENTORY_ADJUSTMENT',
  DEPRECIATION = 'DEPRECIATION',
  PAYROLL = 'PAYROLL',
  TAX_PAYMENT = 'TAX_PAYMENT',
  OPENING_BALANCE = 'OPENING_BALANCE',
  YEAR_END_CLOSE = 'YEAR_END_CLOSE',
  FX_REVALUATION = 'FX_REVALUATION',
}

export enum JournalPurpose {
  PRIMARY = 'PRIMARY',           // Main journal for the transaction
  COGS = 'COGS',                 // Cost of goods sold for inventory items
  REVERSAL = 'REVERSAL',         // Reversing entry for void/correction
  RECLASSIFICATION = 'RECLASSIFICATION',
}

export enum BankTransactionStatus {
  IMPORTED = 'IMPORTED',
  CATEGORIZED = 'CATEGORIZED',
  MATCHED = 'MATCHED',
  RECONCILED = 'RECONCILED',
  EXCLUDED = 'EXCLUDED',
}

export enum BankTransactionType {
  DEBIT = 'DEBIT',   // Money out
  CREDIT = 'CREDIT', // Money in
}

export enum ReconciliationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ── Tax ────────────────────────────────────────────────────

export enum TaxType {
  OUTPUT = 'OUTPUT',   // Sales tax collected
  INPUT = 'INPUT',     // Purchase tax paid (recoverable)
  NONE = 'NONE',       // No tax
}

export enum TaxBehavior {
  EXCLUSIVE = 'EXCLUSIVE', // Tax added on top of price
  INCLUSIVE = 'INCLUSIVE',  // Tax included in price
}

// ── Fiscal ─────────────────────────────────────────────────

export enum FiscalPeriodStatus {
  OPEN = 'OPEN',
  SOFT_CLOSE = 'SOFT_CLOSE',
  HARD_CLOSE = 'HARD_CLOSE',
}

export enum FiscalYearStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

// ── Auth & RBAC ────────────────────────────────────────────

export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  FIRM_MANAGER = 'FIRM_MANAGER',
  MEMBER = 'MEMBER',
}

export enum CompanyRole {
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  BOOKKEEPER = 'BOOKKEEPER',
  APPROVER = 'APPROVER',
  EMPLOYEE = 'EMPLOYEE',
  READ_ONLY_AUDITOR = 'READ_ONLY_AUDITOR',
}

export enum Permission {
  // Accounting
  ACCOUNTS_VIEW = 'accounts.view',
  ACCOUNTS_CREATE = 'accounts.create',
  ACCOUNTS_EDIT = 'accounts.edit',
  ACCOUNTS_DELETE = 'accounts.delete',
  JOURNALS_VIEW = 'journals.view',
  JOURNALS_CREATE = 'journals.create',
  JOURNALS_POST = 'journals.post',
  JOURNALS_VOID = 'journals.void',
  FISCAL_VIEW = 'fiscal.view',
  FISCAL_MANAGE = 'fiscal.manage',
  FISCAL_CLOSE = 'fiscal.close',

  // Sales
  CUSTOMERS_VIEW = 'customers.view',
  CUSTOMERS_CREATE = 'customers.create',
  CUSTOMERS_EDIT = 'customers.edit',
  INVOICES_VIEW = 'invoices.view',
  INVOICES_CREATE = 'invoices.create',
  INVOICES_EDIT = 'invoices.edit',
  INVOICES_SEND = 'invoices.send',
  INVOICES_VOID = 'invoices.void',
  PAYMENTS_VIEW = 'payments.view',
  PAYMENTS_CREATE = 'payments.create',
  PAYMENTS_VOID = 'payments.void',

  // Purchases
  VENDORS_VIEW = 'vendors.view',
  VENDORS_CREATE = 'vendors.create',
  VENDORS_EDIT = 'vendors.edit',
  BILLS_VIEW = 'bills.view',
  BILLS_CREATE = 'bills.create',
  BILLS_EDIT = 'bills.edit',
  BILLS_APPROVE = 'bills.approve',
  BILLS_VOID = 'bills.void',
  VENDOR_PAYMENTS_VIEW = 'vendor_payments.view',
  VENDOR_PAYMENTS_CREATE = 'vendor_payments.create',
  EXPENSES_VIEW = 'expenses.view',
  EXPENSES_CREATE = 'expenses.create',
  EXPENSES_EDIT = 'expenses.edit',
  EXPENSES_APPROVE = 'expenses.approve',

  // Banking
  BANKING_VIEW = 'banking.view',
  BANKING_IMPORT = 'banking.import',
  BANKING_CATEGORIZE = 'banking.categorize',
  BANKING_RECONCILE = 'banking.reconcile',
  BANK_ACCOUNTS_MANAGE = 'bank_accounts.manage',

  // Reports
  REPORTS_VIEW = 'reports.view',
  REPORTS_EXPORT = 'reports.export',

  // Settings & Admin
  COMPANY_SETTINGS = 'company.settings',
  USERS_VIEW = 'users.view',
  USERS_INVITE = 'users.invite',
  USERS_MANAGE = 'users.manage',
  ROLES_MANAGE = 'roles.manage',
  AUDIT_VIEW = 'audit.view',

  // Documents
  DOCUMENTS_VIEW = 'documents.view',
  DOCUMENTS_UPLOAD = 'documents.upload',
  DOCUMENTS_DELETE = 'documents.delete',

  // Inventory
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_MANAGE = 'inventory.manage',

  // Projects
  PROJECTS_VIEW = 'projects.view',
  PROJECTS_MANAGE = 'projects.manage',
  TIME_ENTRIES_VIEW = 'time_entries.view',
  TIME_ENTRIES_MANAGE = 'time_entries.manage',
}

// ── Invitation ─────────────────────────────────────────────

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

// ── Approval ───────────────────────────────────────────────

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ── Notification ───────────────────────────────────────────

export enum NotificationType {
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  BILL_DUE = 'BILL_DUE',
  APPROVAL_REQUIRED = 'APPROVAL_REQUIRED',
  RECONCILIATION_NEEDED = 'RECONCILIATION_NEEDED',
  PERIOD_CLOSE_REMINDER = 'PERIOD_CLOSE_REMINDER',
  SYSTEM = 'SYSTEM',
}

// ── Workflow ───────────────────────────────────────────────

export enum WorkflowTrigger {
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  BILL_OVER_THRESHOLD = 'BILL_OVER_THRESHOLD',
  BANK_TRANSACTION_UNCATEGORIZED = 'BANK_TRANSACTION_UNCATEGORIZED',
  MONTH_END = 'MONTH_END',
  CUSTOM = 'CUSTOM',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
}

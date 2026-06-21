export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}
export declare enum AccountSubType {
    CASH_AND_BANK = "CASH_AND_BANK",
    ACCOUNTS_RECEIVABLE = "ACCOUNTS_RECEIVABLE",
    CURRENT_ASSET = "CURRENT_ASSET",
    INVENTORY = "INVENTORY",
    FIXED_ASSET = "FIXED_ASSET",
    OTHER_ASSET = "OTHER_ASSET",
    ACCOUNTS_PAYABLE = "ACCOUNTS_PAYABLE",
    CURRENT_LIABILITY = "CURRENT_LIABILITY",
    LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
    CREDIT_CARD = "CREDIT_CARD",
    OTHER_LIABILITY = "OTHER_LIABILITY",
    OWNERS_EQUITY = "OWNERS_EQUITY",
    RETAINED_EARNINGS = "RETAINED_EARNINGS",
    OPENING_BALANCE = "OPENING_BALANCE",
    OTHER_EQUITY = "OTHER_EQUITY",
    SALES_REVENUE = "SALES_REVENUE",
    OTHER_INCOME = "OTHER_INCOME",
    COST_OF_GOODS_SOLD = "COST_OF_GOODS_SOLD",
    OPERATING_EXPENSE = "OPERATING_EXPENSE",
    PAYROLL_EXPENSE = "PAYROLL_EXPENSE",
    OTHER_EXPENSE = "OTHER_EXPENSE"
}
export declare enum NormalBalance {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}
export declare enum DocumentStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    SENT = "SENT",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    VOID = "VOID",
    CANCELLED = "CANCELLED"
}
export declare enum JournalSourceType {
    MANUAL = "MANUAL",
    INVOICE = "INVOICE",
    PAYMENT = "PAYMENT",
    CREDIT_NOTE = "CREDIT_NOTE",
    BILL = "BILL",
    VENDOR_PAYMENT = "VENDOR_PAYMENT",
    VENDOR_CREDIT = "VENDOR_CREDIT",
    EXPENSE = "EXPENSE",
    BANK_TRANSFER = "BANK_TRANSFER",
    BANK_FEE = "BANK_FEE",
    BANK_INTEREST = "BANK_INTEREST",
    INVENTORY_ADJUSTMENT = "INVENTORY_ADJUSTMENT",
    DEPRECIATION = "DEPRECIATION",
    PAYROLL = "PAYROLL",
    TAX_PAYMENT = "TAX_PAYMENT",
    OPENING_BALANCE = "OPENING_BALANCE",
    YEAR_END_CLOSE = "YEAR_END_CLOSE",
    FX_REVALUATION = "FX_REVALUATION"
}
export declare enum JournalPurpose {
    PRIMARY = "PRIMARY",
    COGS = "COGS",
    REVERSAL = "REVERSAL",
    RECLASSIFICATION = "RECLASSIFICATION"
}
export declare enum BankTransactionStatus {
    IMPORTED = "IMPORTED",
    CATEGORIZED = "CATEGORIZED",
    MATCHED = "MATCHED",
    RECONCILED = "RECONCILED",
    EXCLUDED = "EXCLUDED"
}
export declare enum BankTransactionType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}
export declare enum ReconciliationStatus {
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED"
}
export declare enum TaxType {
    OUTPUT = "OUTPUT",
    INPUT = "INPUT",
    NONE = "NONE"
}
export declare enum TaxBehavior {
    EXCLUSIVE = "EXCLUSIVE",
    INCLUSIVE = "INCLUSIVE"
}
export declare enum FiscalPeriodStatus {
    OPEN = "OPEN",
    SOFT_CLOSE = "SOFT_CLOSE",
    HARD_CLOSE = "HARD_CLOSE"
}
export declare enum FiscalYearStatus {
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED"
}
export declare enum WorkspaceRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    FIRM_MANAGER = "FIRM_MANAGER",
    MEMBER = "MEMBER"
}
export declare enum CompanyRole {
    COMPANY_ADMIN = "COMPANY_ADMIN",
    ACCOUNTANT = "ACCOUNTANT",
    BOOKKEEPER = "BOOKKEEPER",
    APPROVER = "APPROVER",
    EMPLOYEE = "EMPLOYEE",
    READ_ONLY_AUDITOR = "READ_ONLY_AUDITOR"
}
export declare enum Permission {
    ACCOUNTS_VIEW = "accounts.view",
    ACCOUNTS_CREATE = "accounts.create",
    ACCOUNTS_EDIT = "accounts.edit",
    ACCOUNTS_DELETE = "accounts.delete",
    JOURNALS_VIEW = "journals.view",
    JOURNALS_CREATE = "journals.create",
    JOURNALS_POST = "journals.post",
    JOURNALS_VOID = "journals.void",
    FISCAL_VIEW = "fiscal.view",
    FISCAL_MANAGE = "fiscal.manage",
    FISCAL_CLOSE = "fiscal.close",
    CUSTOMERS_VIEW = "customers.view",
    CUSTOMERS_CREATE = "customers.create",
    CUSTOMERS_EDIT = "customers.edit",
    INVOICES_VIEW = "invoices.view",
    INVOICES_CREATE = "invoices.create",
    INVOICES_EDIT = "invoices.edit",
    INVOICES_SEND = "invoices.send",
    INVOICES_VOID = "invoices.void",
    PAYMENTS_VIEW = "payments.view",
    PAYMENTS_CREATE = "payments.create",
    PAYMENTS_VOID = "payments.void",
    VENDORS_VIEW = "vendors.view",
    VENDORS_CREATE = "vendors.create",
    VENDORS_EDIT = "vendors.edit",
    BILLS_VIEW = "bills.view",
    BILLS_CREATE = "bills.create",
    BILLS_EDIT = "bills.edit",
    BILLS_APPROVE = "bills.approve",
    BILLS_VOID = "bills.void",
    VENDOR_PAYMENTS_VIEW = "vendor_payments.view",
    VENDOR_PAYMENTS_CREATE = "vendor_payments.create",
    EXPENSES_VIEW = "expenses.view",
    EXPENSES_CREATE = "expenses.create",
    EXPENSES_EDIT = "expenses.edit",
    EXPENSES_APPROVE = "expenses.approve",
    BANKING_VIEW = "banking.view",
    BANKING_IMPORT = "banking.import",
    BANKING_CATEGORIZE = "banking.categorize",
    BANKING_RECONCILE = "banking.reconcile",
    BANK_ACCOUNTS_MANAGE = "bank_accounts.manage",
    REPORTS_VIEW = "reports.view",
    REPORTS_EXPORT = "reports.export",
    COMPANY_SETTINGS = "company.settings",
    USERS_VIEW = "users.view",
    USERS_INVITE = "users.invite",
    USERS_MANAGE = "users.manage",
    ROLES_MANAGE = "roles.manage",
    AUDIT_VIEW = "audit.view",
    DOCUMENTS_VIEW = "documents.view",
    DOCUMENTS_UPLOAD = "documents.upload",
    DOCUMENTS_DELETE = "documents.delete",
    INVENTORY_VIEW = "inventory.view",
    INVENTORY_MANAGE = "inventory.manage",
    PROJECTS_VIEW = "projects.view",
    PROJECTS_MANAGE = "projects.manage",
    TIME_ENTRIES_VIEW = "time_entries.view",
    TIME_ENTRIES_MANAGE = "time_entries.manage"
}
export declare enum InvitationStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    EXPIRED = "EXPIRED",
    REVOKED = "REVOKED"
}
export declare enum ApprovalStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum NotificationType {
    INVOICE_SENT = "INVOICE_SENT",
    INVOICE_PAID = "INVOICE_PAID",
    INVOICE_OVERDUE = "INVOICE_OVERDUE",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    BILL_DUE = "BILL_DUE",
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
    RECONCILIATION_NEEDED = "RECONCILIATION_NEEDED",
    PERIOD_CLOSE_REMINDER = "PERIOD_CLOSE_REMINDER",
    SYSTEM = "SYSTEM"
}
export declare enum WorkflowTrigger {
    INVOICE_OVERDUE = "INVOICE_OVERDUE",
    BILL_OVER_THRESHOLD = "BILL_OVER_THRESHOLD",
    BANK_TRANSACTION_UNCATEGORIZED = "BANK_TRANSACTION_UNCATEGORIZED",
    MONTH_END = "MONTH_END",
    CUSTOM = "CUSTOM"
}
export declare enum SubscriptionPlan {
    FREE = "FREE",
    STARTER = "STARTER",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELLED = "CANCELLED",
    TRIAL = "TRIAL"
}

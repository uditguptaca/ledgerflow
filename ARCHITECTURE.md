# LedgerFlow — Architecture & Design Decisions

This document outlines the core architecture, constraints, and structural design choices of LedgerFlow.

## 1. Double-Entry Posting Engine (`PostingService`)
LedgerFlow implements a strict double-entry ledger posting engine built on top of Prisma.
- **Atomic Transactions**: All postings create a `JournalEntry` and a matching set of `JournalLine` records in a single database transaction.
- **Balance Invariant**: For every journal entry, the sum of all debit line amounts must exactly equal the sum of all credit line amounts.
- **Precision**: Money arithmetic is performed using `Decimal.js` to prevent IEEE 754 floating-point inaccuracies.
- **Control Account Protection**: Accounts designated as control accounts (Accounts Receivable, Accounts Payable, Tax Payable, Tax Receivable) can only be posted to through sub-ledgers (Invoices, Bills, etc.) and are locked from manual journal entries.
- **Idempotency**: Every sub-ledger posting provides a unique `sourceType`, `sourceId`, and `purpose` compound index constraint to prevent duplicate postings.

## 2. Multi-Tenancy & Security
LedgerFlow utilizes a workspace-level multi-tenant architecture:
- **Workspace Isolation**: A `Workspace` represents the top-level isolation unit. All data is scoped to a workspace.
- **Company Context**: Within a workspace, users can switch between multiple legal `Company` entities. All transactions are scoped to a specific `companyId`.
- **Role-Based Access Control (RBAC)**: Supports roles like `COMPANY_ADMIN`, `ACCOUNTANT`, `BOOKKEEPER`, `APPROVER`, `EMPLOYEE`, and `READ_ONLY_AUDITOR`. Guards enforce permission checks (e.g., `invoice.create`, `reports.view`) on NestJS controllers.

## 3. Banking & Reconciliation matching
Reconciliation matches physical bank statements to the general ledger:
- **CSV Parser**: Imports standard bank transactions into a statement inbox.
- **Matching Engine**: Supports matching by date proximity, exact amount, and reference code.
- **Rule Categorization**: Allows setting up rules (e.g., matching a payee substring to a specific general ledger account) to automate ledger entries for bank fees, subscriptions, and interest.

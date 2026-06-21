# LedgerFlow 💼

LedgerFlow is a complete, production-grade, multi-company double-entry accounting SaaS platform. It features strict double-entry ledger balance controls, role-based access control (RBAC), multi-tenant isolation, bank reconciliation matching, financial reports (Trial Balance, General Ledger, Profit & Loss, Balance Sheet, Cash Flow), auditing, document uploads, and a premium visual dashboard.

## 🚀 Quick Start (Zero Dependency)

LedgerFlow is configured to use a local **SQLite** database out of the box, meaning you do not need to run or configure external database servers like PostgreSQL.

### 1. Install & Build
From the project root directory, run:
```bash
npm run install:all
npm run build
```

### 2. Run the Application
Start both the backend and frontend dev servers concurrently:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🔐 Seeded Login Credentials

The database comes fully seeded with a tenant workspace ("Northstar Advisory"), default charts of accounts, and transactional history. You can log in using any of the following accounts:

| User Email | Password | Role / Access Scope |
| :--- | :--- | :--- |
| `sarah@northstar.demo` | `Demo2024!` | **Workspace Owner** (Access to all companies: BluePeak, Cedar Lane, Nova) |
| `marcus@northstar.demo` | `Demo2024!` | **Accountant** (Access to BluePeak Construction and Nova Health only) |
| `lisa@cedarlane.demo` | `Demo2024!` | **Company Admin** (Access to Cedar Lane Retail only) |
| `james@northstar.demo` | `Demo2024!` | **Read-Only Auditor** (Read-only access to all companies) |

---

## 🏗️ Monorepo Structure

```
ledgerflow/
├── backend/            # NestJS API application (Prisma ORM, SQLite database)
├── frontend/           # Next.js 14 App Router dashboard application
└── packages/
    └── shared/         # Common enums, role maps, and configuration constants
```

## 📊 Seeded Companies & Verification
During the seed process, the seeder automatically verifies the double-entry balance invariant (Debits must exactly equal Credits).
* **BluePeak Construction** (Project-based model): Debits/Credits = `$324,039.00` (Balanced)
* **Cedar Lane Retail** (Inventory-based model): Debits/Credits = `$284,039.00` (Balanced)
* **Nova Health Services** (Service-based model): Debits/Credits = `$259,039.00` (Balanced)

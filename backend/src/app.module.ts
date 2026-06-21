import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { CompanyModule } from './company/company.module';
import { RbacModule } from './rbac/rbac.module';
import { AccountingModule } from './accounting/accounting.module';
import { CustomerModule } from './customer/customer.module';
import { VendorModule } from './vendor/vendor.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PaymentModule } from './payment/payment.module';
import { BillModule } from './bill/bill.module';
import { VendorPaymentModule } from './vendor-payment/vendor-payment.module';
import { ExpenseModule } from './expense/expense.module';
import { TaxModule } from './tax/tax.module';
import { BankingModule } from './banking/banking.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { ReportModule } from './report/report.module';
import { AuditModule } from './audit/audit.module';
import { ExportModule } from './export/export.module';
import { DocumentModule } from './document/document.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    WorkspaceModule,
    CompanyModule,
    RbacModule,
    AccountingModule,
    CustomerModule,
    VendorModule,
    InvoiceModule,
    PaymentModule,
    BillModule,
    VendorPaymentModule,
    ExpenseModule,
    TaxModule,
    BankingModule,
    ReconciliationModule,
    ReportModule,
    AuditModule,
    ExportModule,
    DocumentModule,
    NotificationModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../common/prisma/prisma.module';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { TaxService } from '../tax/tax.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    PostingService,
    AccountService,
    TaxService,
    AuditService,
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { TaxService } from '../tax/tax.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    PostingService,
    AccountService,
    TaxService,
    AuditService,
  ],
  exports: [ExpenseService],
})
export class ExpenseModule {}

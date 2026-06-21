import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BillController } from './bill.controller';
import { BillService } from './bill.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { TaxService } from '../tax/tax.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [BillController],
  providers: [
    BillService,
    PostingService,
    AccountService,
    TaxService,
    AuditService,
  ],
  exports: [BillService],
})
export class BillModule {}

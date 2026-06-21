import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../common/prisma/prisma.module';
import { VendorPaymentController } from './vendor-payment.controller';
import { VendorPaymentService } from './vendor-payment.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [VendorPaymentController],
  providers: [
    VendorPaymentService,
    PostingService,
    AccountService,
    AuditService,
  ],
  exports: [VendorPaymentService],
})
export class VendorPaymentModule {}

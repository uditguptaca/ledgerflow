import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../common/prisma/prisma.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PostingService } from '../accounting/posting.service';
import { AccountService } from '../accounting/account.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PostingService,
    AccountService,
    AuditService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}

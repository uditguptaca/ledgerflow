import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { PostingService } from './posting.service';
import { AccountingController } from './accounting.controller';

@Module({
  controllers: [AccountingController],
  providers: [AccountService, PostingService],
  exports: [AccountService, PostingService],
})
export class AccountingModule {}

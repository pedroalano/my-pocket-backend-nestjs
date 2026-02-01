import { Module } from '@nestjs/common';
import { TransactionController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

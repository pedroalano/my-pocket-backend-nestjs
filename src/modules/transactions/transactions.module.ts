import { Module } from '@nestjs/common';
import { TransactionController } from './transactions.controller';

@Module({
  controllers: [TransactionController],
  providers: [],
  exports: [],
})
export class TransactionsModule {}

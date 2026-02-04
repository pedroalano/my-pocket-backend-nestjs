import { Module } from '@nestjs/common';
import { TransactionController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [CategoriesModule],
  controllers: [TransactionController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

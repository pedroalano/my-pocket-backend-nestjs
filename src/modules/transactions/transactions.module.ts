import { Module } from '@nestjs/common';
import { TransactionController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CategoriesModule } from '../categories/categories.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [CategoriesModule, SharedModule],
  controllers: [TransactionController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

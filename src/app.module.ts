import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetModule } from './modules/budgets/budget.module';
import { SharedModule } from './modules/shared';

@Module({
  imports: [
    SharedModule,
    HealthModule,
    CategoriesModule,
    TransactionsModule,
    BudgetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

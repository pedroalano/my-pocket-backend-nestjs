import { Module } from '@nestjs/common';
import { BudgetController } from './budget.controller';

@Module({
  imports: [],
  controllers: [BudgetController],
  providers: [],
  exports: [],
})
export class BudgetModule {}

import { CategoryType } from '@prisma/client';

export class BudgetVsActualCategoryDto {
  id: string;
  name: string;
  type: CategoryType;
}

export class BudgetVsActualDto {
  category: BudgetVsActualCategoryDto;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  percentageUsed: number;
}

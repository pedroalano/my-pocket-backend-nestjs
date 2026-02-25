import { CategoryType } from '@prisma/client';

export class BudgetVsActualCategoryDto {
  id: string;
  name: string;
  type: CategoryType;
}

export class BudgetVsActualDto {
  categoryId: string;
  category: BudgetVsActualCategoryDto;
  budget: number;
  actual: number;
  difference: number;
  percentageUsed: number;
}

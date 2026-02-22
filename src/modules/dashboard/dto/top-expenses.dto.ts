import { CategoryType } from '@prisma/client';

export class TopExpenseCategoryDto {
  id: string;
  name: string;
  type: CategoryType;
}

export class TopExpenseDto {
  id: string;
  description: string | null;
  date: string;
  amount: number;
  category: TopExpenseCategoryDto;
}

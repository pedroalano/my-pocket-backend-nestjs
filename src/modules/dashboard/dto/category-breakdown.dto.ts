import { CategoryType } from '@prisma/client';

export class CategoryBreakdownItemDto {
  id: string;
  name: string;
  type: CategoryType;
}

export class CategoryBreakdownDto {
  category: CategoryBreakdownItemDto;
  totalAmount: number;
  percentage: number;
}

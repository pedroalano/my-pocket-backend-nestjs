import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { BudgetType } from '@prisma/client';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsUUID()
  categoryId: string;
  @IsNumber()
  month: number;
  @IsNumber()
  year: number;

  @IsEnum(BudgetType)
  type: BudgetType;
}

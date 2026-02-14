import { IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { BudgetType } from '@prisma/client';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsEnum(BudgetType)
  type?: BudgetType;
}

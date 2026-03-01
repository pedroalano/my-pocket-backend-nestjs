import { ApiProperty } from '@nestjs/swagger';
import { BudgetType } from '@prisma/client';

export class BudgetDto {
  @ApiProperty({
    description: 'The unique identifier of the budget',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Budget amount (must be positive)',
    example: '500.00',
    type: 'string',
  })
  amount: string;

  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Month of the budget (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  month: number;

  @ApiProperty({
    description: 'Year of the budget',
    example: 2026,
  })
  year: number;

  @ApiProperty({
    description: 'Budget type',
    enum: BudgetType,
    example: BudgetType.EXPENSE,
  })
  type: BudgetType;

  @ApiProperty({
    description: 'User ID who owns the budget',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  userId: string;
}

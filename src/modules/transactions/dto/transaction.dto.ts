import { ApiProperty } from '@nestjs/swagger';

export class TransactionDto {
  @ApiProperty({
    description: 'The unique identifier of the transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Transaction amount (must be positive)',
    example: 99.99,
  })
  amount: number;

  @ApiProperty({
    description: 'Transaction type',
    example: 'EXPENSE',
  })
  type: string;

  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  categoryId: string;

  @ApiProperty({
    description: 'Transaction date in ISO 8601 format',
    example: '2026-02-26T10:00:00.000Z',
  })
  date: string;

  @ApiProperty({
    description: 'Optional description of the transaction',
    example: 'Grocery shopping at Walmart',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'User ID who owns the transaction',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  userId: string;

  @ApiProperty({
    description: 'Timestamp when the transaction was created',
    example: '2026-02-26T10:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Timestamp when the transaction was last updated',
    example: '2026-02-26T10:00:00.000Z',
  })
  updatedAt: string;
}

import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Transaction amount (must be positive)',
    example: 99.99,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Transaction type',
    example: 'EXPENSE',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Transaction date in ISO 8601 format',
    example: '2026-02-26T10:00:00.000Z',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Optional description of the transaction',
    example: 'Grocery shopping at Walmart',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

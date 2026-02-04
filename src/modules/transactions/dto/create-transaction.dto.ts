import { IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  type: string;

  @IsNumber()
  categoryId: number;

  @IsString()
  date: string;

  @IsString()
  description: string;
}

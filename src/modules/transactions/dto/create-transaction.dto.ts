import { IsNumber, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  type: string;

  @IsString()
  categoryId: string;

  @IsString()
  date: string;

  @IsString()
  description: string;
}

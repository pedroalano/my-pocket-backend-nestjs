import { IsDateString, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  type: string;

  @IsUUID()
  categoryId: string;

  @IsDateString()
  date: string;

  @IsString()
  description: string;
}

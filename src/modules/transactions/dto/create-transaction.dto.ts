import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  type: string;

  @IsUUID()
  categoryId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  description?: string;
}

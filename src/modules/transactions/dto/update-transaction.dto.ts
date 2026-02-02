import { IsNumber, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsNumber()
  amount?: number;
  @IsString()
  type?: string;
  @IsNumber()
  categoryId?: number;
  @IsString()
  date?: string;
  @IsString()
  description?: string;
}

import { IsNumber, IsString, IsOptional } from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsNumber()
  id?: number;
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

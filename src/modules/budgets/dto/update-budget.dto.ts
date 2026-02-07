import { IsNumber, IsString } from 'class-validator';

export class UpdateBudgetDto {
  @IsNumber()
  amount?: number;
  @IsNumber()
  categoryId?: number;
  @IsNumber()
  month?: number;
  @IsNumber()
  year?: number;
  @IsString()
  type?: string;
}

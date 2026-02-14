import { IsNumber, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;
  @IsString()
  categoryId: string;
  @IsNumber()
  month: number;
  @IsNumber()
  year: number;
  @IsString()
  type: string;
}

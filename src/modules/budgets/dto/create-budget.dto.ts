import { IsNumber, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;
  @IsNumber()
  categoryId: number;
  @IsNumber()
  month: number;
  @IsNumber()
  year: number;
  @IsString()
  type: string;
}

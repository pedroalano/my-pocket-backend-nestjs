import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BatchCategoryItemDto {
  @ApiProperty({ example: 'Salary' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'INCOME', enum: ['INCOME', 'EXPENSE'] })
  @IsString()
  @MaxLength(20)
  type: string;
}

export class CreateCategoryBatchDto {
  @ApiProperty({ type: [BatchCategoryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCategoryItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  categories: BatchCategoryItemDto[];
}

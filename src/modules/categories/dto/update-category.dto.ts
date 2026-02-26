import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto {
  //   @IsNumber()
  //   id: number;
  @ApiProperty({ description: 'The name of the category', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The type of the category (e.g., expense, income)',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

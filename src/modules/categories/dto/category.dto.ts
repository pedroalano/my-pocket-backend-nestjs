import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ description: 'The name of the category' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The type of the category (e.g., expense, income)',
  })
  @IsString()
  type: string;
}

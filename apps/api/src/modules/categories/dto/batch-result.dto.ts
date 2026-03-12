import { ApiProperty } from '@nestjs/swagger';

export class BatchResultDto {
  @ApiProperty({ example: 8 })
  created: number;

  @ApiProperty({ example: 3 })
  skipped: number;
}

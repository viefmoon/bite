import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class MarkItemPreparedDto {
  @ApiProperty({
    type: Boolean,
    description: 'Si el item está preparado o no',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPrepared?: boolean;
}

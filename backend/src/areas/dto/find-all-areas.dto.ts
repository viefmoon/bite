import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllAreasDto extends PaginationParams {
  @ApiProperty({
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}

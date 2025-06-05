import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllCategoriesDto extends PaginationParams {
  @ApiPropertyOptional({ example: 'Bebidas' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;
}

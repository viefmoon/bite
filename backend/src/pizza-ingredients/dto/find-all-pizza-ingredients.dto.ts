import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllPizzaIngredientsDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by product ID',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
}

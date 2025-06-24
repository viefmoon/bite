import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllAdjustmentsDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by order ID',
  })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order item ID',
  })
  @IsOptional()
  @IsString()
  orderItemId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user who applied the adjustment',
  })
  @IsOptional()
  @IsString()
  appliedById?: string;
}

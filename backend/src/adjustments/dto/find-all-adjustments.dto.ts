import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationParams } from '../../utils/types/pagination-params';

export class FindAllAdjustmentsDto extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Filter by order ID',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order item ID',
  })
  @IsOptional()
  @IsUUID()
  orderItemId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user who applied the adjustment',
  })
  @IsOptional()
  @IsUUID()
  appliedById?: string;
}

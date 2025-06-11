import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationParams } from '../../utils/types/pagination-params';
import { AdjustmentType } from '../domain/enums/adjustment-type.enum';

export class FindAllAdjustmentsDto extends PaginationParams {
  @ApiPropertyOptional({
    enum: AdjustmentType,
    description: 'Filter by adjustment type',
  })
  @IsOptional()
  @IsEnum(AdjustmentType)
  type?: AdjustmentType;

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

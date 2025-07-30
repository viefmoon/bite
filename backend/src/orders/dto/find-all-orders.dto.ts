import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderType } from '../domain/enums/order-type.enum';

export class FindAllOrdersDto {
  @ApiProperty({
    description: 'Filter orders by user ID',
    example: 'USER-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Filter orders by table ID',
    example: 'TABLE-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiProperty({
    description: 'Filter orders by shift ID',
    example: 'SHIFT-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by status (single or comma-separated string)',
    examples: {
      single: { value: 'COMPLETED' },
      multiple: { value: 'COMPLETED,CANCELLED' },
      array: { value: ['COMPLETED', 'CANCELLED'] },
    },
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim().toUpperCase());
    }
    return Array.isArray(value) ? value : [value];
  })
  status?: OrderStatus[] | string;

  @ApiProperty({
    description: 'Filter orders by type',
    enum: OrderType,
    example: OrderType.DINE_IN,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiProperty({
    description: 'Filter orders created after this date',
    example: '2023-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter orders created before this date',
    example: '2023-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description:
      'Fields to include in response (minimal for optimized queries)',
    enum: ['minimal', 'full'],
    example: 'minimal',
  })
  @IsOptional()
  @IsIn(['minimal', 'full'])
  includeFields?: 'minimal' | 'full';

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit per page',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

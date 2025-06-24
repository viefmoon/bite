import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
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
    description: 'Filter orders by daily order counter ID',
    example: 'COUNTER-1',
    required: false,
  })
  @IsOptional()
  @IsString()
  dailyOrderCounterId?: string;

  @ApiProperty({
    description: 'Filter orders by status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiProperty({
    description: 'Filter orders by multiple statuses',
    enum: OrderStatus,
    isArray: true,
    example: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(OrderStatus, { each: true })
  orderStatuses?: OrderStatus[];

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
}

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderType } from '../domain/enums/order-type.enum';

export class FindAllOrdersDto {
  @ApiProperty({
    description: 'Filter orders by user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Filter orders by table ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({
    description: 'Filter orders by daily order counter ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
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

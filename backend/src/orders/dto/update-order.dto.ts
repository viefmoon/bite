import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
  ValidateIf,
  IsPhoneNumber,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderType } from '../domain/enums/order-type.enum';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class UpdateOrderDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario que realiza la orden',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la mesa',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tableId?: string;

  @ApiProperty({
    type: Date,
    example: '2023-01-01T14:30:00.000Z',
    description: 'Fecha y hora programada para la orden',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'Estado de la orden',
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @ApiProperty({
    enum: OrderType,
    example: OrderType.DINE_IN,
    description: 'Tipo de orden',
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiProperty({
    type: Number,
    example: 150.5,
    description: 'Subtotal de la orden',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  subtotal?: number;

  @ApiProperty({
    type: Number,
    example: 177.59,
    description: 'Total de la orden',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  total?: number;

  @ApiProperty({
    type: String,
    example: 'Please make it spicy.',
    description: 'Optional notes for the order',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Items de la orden',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @ApiProperty({
    type: String,
    example: '+15551234567',
    description:
      'Número de teléfono para la entrega (obligatorio si orderType es DELIVERY)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.orderType === OrderType.DELIVERY)
  @IsNotEmpty({
    message: 'El número de teléfono es obligatorio para entregas a domicilio',
  })
  @IsPhoneNumber(undefined, { message: 'El número de teléfono no es válido' })
  phoneNumber?: string | null;

  @ApiProperty({
    type: String,
    example: 'John Doe',
    description: 'Customer name (required if orderType is TAKE_AWAY)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.orderType === OrderType.TAKE_AWAY)
  @IsNotEmpty({
    message: 'Customer name is required for take-away orders',
  })
  @IsString()
  customerName?: string | null;

  @ApiProperty({
    type: String,
    example: '456 Oak Ave, Anytown, USA 67890',
    description: 'Delivery address (required if orderType is DELIVERY)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.orderType === OrderType.DELIVERY)
  @IsNotEmpty({
    message: 'Delivery address is required for delivery orders',
  })
  @IsString()
  deliveryAddress?: string | null;
}

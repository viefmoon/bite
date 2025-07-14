import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
  IsString,
  IsBoolean,
} from 'class-validator';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { OrderType } from '../domain/enums/order-type.enum';
import { Type } from 'class-transformer';
import { OrderItemInputDto } from './order-item-input.dto';
import { DeliveryInfoDto } from './delivery-info.dto';

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
    example: 'TABLE-1',
    description: 'ID de la mesa',
    required: false,
  })
  @IsOptional()
  @IsString()
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
    type: String,
    example: 'CUST-1',
    description: 'ID del cliente',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    type: [OrderItemInputDto],
    description: 'Items de la orden',
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];

  @ApiProperty({
    type: DeliveryInfoDto,
    description: 'Información de entrega',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo?: DeliveryInfoDto;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si se debe crear una mesa temporal',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isTemporaryTable?: boolean;

  @ApiProperty({
    type: String,
    example: 'Mesa Terraza 1',
    description: 'Nombre de la mesa temporal',
    required: false,
  })
  @IsOptional()
  @IsString()
  temporaryTableName?: string;

  @ApiProperty({
    type: String,
    example: 'AREA-1',
    description: 'ID del área para la mesa temporal',
    required: false,
  })
  @IsOptional()
  @IsString()
  temporaryTableAreaId?: string;

  @ApiProperty({
    type: Array,
    description: 'Ajustes de la orden',
    required: false,
  })
  @IsOptional()
  adjustments?: any[];
}

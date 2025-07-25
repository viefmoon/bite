import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  ValidateNested,
  ValidateIf,
  IsString,
} from 'class-validator';
import { OrderType } from '../domain/enums/order-type.enum';
import { Type } from 'class-transformer';
import { OrderItemInputDto } from './order-item-input.dto';
import { DeliveryInfoDto } from './delivery-info.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'ID del usuario que realiza la orden (opcional para órdenes de WhatsApp)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.isFromWhatsApp)
  @IsNotEmpty({
    message: 'El ID del usuario es requerido cuando la orden no es de WhatsApp',
  })
  @IsUUID()
  userId?: string;

  @ApiProperty({
    type: String,
    example: 'TABLE-1',
    description: 'ID de la mesa (opcional para órdenes que no son en el local)',
    required: false,
  })
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si se debe crear una mesa temporal',
    required: false,
    default: false,
  })
  @IsOptional()
  isTemporaryTable?: boolean;

  @ApiProperty({
    type: String,
    example: 'Mesa Exterior 1',
    description:
      'Nombre de la mesa temporal a crear (requerido si isTemporaryTable es true)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.isTemporaryTable === true)
  @IsNotEmpty({
    message:
      'El nombre de la mesa temporal es requerido cuando isTemporaryTable es true',
  })
  @IsString()
  temporaryTableName?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'ID del área donde se creará la mesa temporal (requerido si isTemporaryTable es true)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.isTemporaryTable === true)
  @IsNotEmpty({
    message: 'El ID del área es requerido cuando isTemporaryTable es true',
  })
  @IsUUID()
  temporaryTableAreaId?: string;

  @ApiProperty({
    type: Date,
    example: '2023-01-01T14:30:00.000Z',
    description: 'Fecha y hora programada para la orden (opcional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiProperty({
    enum: OrderType,
    example: OrderType.DINE_IN,
    description: 'Tipo de orden (obligatorio)',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({
    type: Number,
    example: 150.5,
    description: 'Subtotal de la orden',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  subtotal: number;

  @ApiProperty({
    type: Number,
    example: 177.59,
    description: 'Total de la orden',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  total: number;

  @ApiProperty({
    type: String,
    example: 'Extra cheese, no onions.',
    description: 'Optional notes for the order',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [OrderItemInputDto],
    description: 'Items de la orden',
    required: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiProperty({
    type: DeliveryInfoDto,
    description:
      'Información de entrega (requerida para todas las órdenes, pero todos los campos son opcionales)',
    required: true,
  })
  @IsNotEmpty({ message: 'La información de entrega es requerida' })
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo: DeliveryInfoDto;

  @ApiProperty({
    type: String,
    example: 'CUST-1',
    description: 'ID del cliente (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si la orden fue creada a través de WhatsApp',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsNotEmpty()
  isFromWhatsApp?: boolean;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del pre-pago a asociar con la orden (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  prepaymentId?: string;
}

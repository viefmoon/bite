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
  ValidateIf, // Importar ValidateIf
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { OrderType } from '../domain/enums/order-type.enum';
import { Type } from 'class-transformer';
import { OrderItemInputDto } from './order-item-input.dto';

export class CreateOrderDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del usuario que realiza la orden (opcional para órdenes de WhatsApp)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.isFromWhatsApp) // Solo validar si no es de WhatsApp
  @IsNotEmpty({
    message: 'El ID del usuario es requerido cuando la orden no es de WhatsApp',
  })
  @IsUUID()
  userId?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la mesa (opcional para órdenes que no son en el local)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tableId?: string;

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
    type: String,
    example: '+523331234567',
    description:
      'Número de teléfono para la entrega (obligatorio si orderType es DELIVERY)',
    required: false, // Es condicionalmente requerido
    nullable: true,
  })
  @IsOptional() // Es opcional en general
  @ValidateIf((o) => o.orderType === OrderType.DELIVERY) // Validar solo si es DELIVERY
  @IsNotEmpty({
    message: 'El número de teléfono es obligatorio para entregas a domicilio',
  }) // Requerido si es DELIVERY
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  @MinLength(10, {
    message: 'El número de teléfono debe tener al menos 10 dígitos',
  })
  @MaxLength(15, {
    message: 'El número de teléfono no puede tener más de 15 dígitos',
  })
  @Matches(/^\+?[0-9]+$/, {
    message:
      'El número de teléfono solo debe contener dígitos y puede empezar con +',
  })
  phoneNumber?: string | null;

  @ApiProperty({
    type: String,
    example: 'John Doe',
    description: 'Customer name (required if orderType is TAKE_AWAY)',
    required: false, // Conditionally required
    nullable: true,
  })
  @IsOptional() // Optional overall
  @ValidateIf((o) => o.orderType === OrderType.TAKE_AWAY) // Validate only if TAKE_AWAY
  @IsNotEmpty({
    message: 'Customer name is required for take-away orders',
  }) // Required if TAKE_AWAY
  @IsString()
  customerName?: string | null;

  @ApiProperty({
    type: String,
    example: '123 Main St, Anytown, USA 12345',
    description: 'Delivery address (required if orderType is DELIVERY)',
    required: false, // Conditionally required
    nullable: true,
  })
  @IsOptional() // Optional overall
  @ValidateIf((o) => o.orderType === OrderType.DELIVERY) // Validate only if DELIVERY
  @IsNotEmpty({
    message: 'Delivery address is required for delivery orders',
  }) // Required if DELIVERY
  @IsString()
  deliveryAddress?: string | null;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del cliente (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
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
}

import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../domain/enums/order-type.enum';
import { OrderStatus } from '../domain/enums/order-status.enum';

export class OrderItemModifierForFinalizationDto {
  @ApiProperty({ description: 'ID del modificador' })
  id: string;

  @ApiProperty({ description: 'Nombre del modificador' })
  name: string;

  @ApiProperty({ description: 'Precio del modificador' })
  price: number;
}

export class OrderItemForFinalizationDto {
  @ApiProperty({ description: 'ID del producto' })
  productId: string;

  @ApiProperty({ description: 'ID de la variante (si aplica)' })
  productVariantId?: string;

  @ApiProperty({ description: 'Cantidad de este item' })
  quantity: number;

  @ApiProperty({ description: 'Precio base unitario' })
  basePrice: number;

  @ApiProperty({ description: 'Precio final unitario (incluye modificadores)' })
  finalPrice: number;

  @ApiProperty({ description: 'Notas de preparación', required: false })
  preparationNotes?: string;

  @ApiProperty({
    description: 'Estado de preparación',
    enum: ['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'],
  })
  preparationStatus: string;

  @ApiProperty({ description: 'Información del producto' })
  product: {
    id: string;
    name: string;
    description?: string;
  };

  @ApiProperty({ description: 'Información de la variante', required: false })
  productVariant?: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Modificadores aplicados',
    type: [OrderItemModifierForFinalizationDto],
  })
  modifiers: OrderItemModifierForFinalizationDto[];

  @ApiProperty({
    description: 'Personalizaciones de pizza seleccionadas',
    required: false,
  })
  selectedPizzaCustomizations?: any[];
}

export class OrderForFinalizationDto {
  @ApiProperty({ description: 'ID de la orden' })
  id: string;

  @ApiProperty({ description: 'Número de orden en el turno' })
  shiftOrderNumber: number;

  @ApiProperty({
    description: 'Tipo de orden',
    enum: OrderType,
  })
  orderType: OrderType;

  @ApiProperty({
    description: 'Estado de la orden',
    enum: OrderStatus,
  })
  orderStatus: OrderStatus;

  @ApiProperty({ description: 'Total de la orden' })
  total: number;

  @ApiProperty({
    description: 'Items de la orden agrupados por igualdad',
    type: [OrderItemForFinalizationDto],
  })
  orderItems: OrderItemForFinalizationDto[];

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiProperty({ description: 'Fecha de finalización', required: false })
  finalizedAt?: Date;

  @ApiProperty({
    description: 'Fecha y hora de entrega programada',
    required: false,
  })
  scheduledAt?: Date;

  @ApiProperty({ description: 'ID de la mesa', required: false })
  tableId?: string;

  @ApiProperty({ description: 'Información del usuario', required: false })
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };

  @ApiProperty({ description: 'Información de la mesa', required: false })
  table?: {
    id: string;
    number: string;
    area?: {
      name: string;
    };
  };

  @ApiProperty({ description: 'Información de entrega', required: false })
  deliveryInfo?: any;

  @ApiProperty({
    description: 'Indica si la orden viene de WhatsApp',
    required: false,
  })
  isFromWhatsApp?: boolean;


  @ApiProperty({
    description: 'Pagos asociados a la orden',
    required: false,
  })
  payments?: any[];

  @ApiProperty({
    description: 'Estados de las pantallas de preparación para la orden',
    required: false,
  })
  preparationScreenStatuses?: {
    id: string;
    preparationScreenId: string;
    preparationScreenName: string;
    status: string;
    startedAt?: Date | null;
    completedAt?: Date | null;
  }[];

  @ApiProperty({
    description: 'Historial de impresiones de tickets para la orden',
    required: false,
  })
  ticketImpressions?: {
    id: string;
    ticketType: string;
    impressionTime: Date;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    printer?: {
      id: string;
      name: string;
    };
  }[];
}

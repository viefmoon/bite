import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../domain/enums/order-type.enum';
import { OrderStatus } from '../domain/enums/order-status.enum';

export class OrderForFinalizationListDto {
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

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de finalización', required: false })
  finalizedAt?: Date;

  @ApiProperty({ description: 'Fecha y hora de entrega programada', required: false })
  scheduledAt?: Date;

  @ApiProperty({ 
    description: 'Resumen de pagos para calcular el monto pendiente',
    required: false,
  })
  paymentsSummary?: {
    totalPaid: number;
  };

  @ApiProperty({ 
    description: 'Información básica de la mesa para órdenes DINE_IN', 
    required: false 
  })
  table?: {
    number: string;
    area?: {
      name: string;
    };
  };

  @ApiProperty({ 
    description: 'Información básica de entrega para órdenes DELIVERY/TAKE_AWAY', 
    required: false 
  })
  deliveryInfo?: {
    recipientName?: string;
    recipientPhone?: string;
    fullAddress?: string;
  };

  @ApiProperty({ 
    description: 'Pantallas de preparación únicas de los productos en la orden', 
    required: false,
    type: [String]
  })
  preparationScreens?: string[];

  @ApiProperty({ 
    type: 'array', 
    items: { 
      type: 'object',
      properties: {
        name: { type: 'string' },
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'READY'] }
      }
    },
    required: false,
    description: 'Estados de las pantallas de preparación'
  })
  preparationScreenStatuses?: Array<{ name: string; status: string }>;

  @ApiProperty({ 
    description: 'Cantidad de tickets impresos para esta orden', 
    required: false
  })
  ticketImpressionCount?: number;

  @ApiProperty({ 
    description: 'Notas de la orden', 
    required: false
  })
  notes?: string;
}
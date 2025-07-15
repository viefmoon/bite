import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../domain/enums/order-type.enum';
import { OrderStatus } from '../domain/enums/order-status.enum';
import { Expose, Type } from 'class-transformer';

class PaymentsSummaryDto {
  @ApiProperty()
  @Expose()
  totalPaid: number;
}

class TableSummaryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  number: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  isTemporary: boolean;

  @ApiProperty({ required: false })
  @Expose()
  area?: {
    name: string;
  };
}

class DeliveryInfoSummaryDto {
  @ApiProperty({ required: false })
  @Expose()
  recipientName?: string;

  @ApiProperty({ required: false })
  @Expose()
  recipientPhone?: string;

  @ApiProperty({ required: false })
  @Expose()
  fullAddress?: string;
}

export class ReceiptListDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  shiftOrderNumber: number;

  @ApiProperty({ enum: OrderType })
  @Expose()
  orderType: OrderType;

  @ApiProperty({ enum: OrderStatus })
  @Expose()
  orderStatus: OrderStatus;

  @ApiProperty()
  @Expose()
  total: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  scheduledAt?: Date;

  @ApiProperty()
  @Expose()
  finalizedAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;

  @ApiProperty({ type: PaymentsSummaryDto, required: false })
  @Type(() => PaymentsSummaryDto)
  @Expose()
  paymentsSummary?: PaymentsSummaryDto;

  @ApiProperty({ type: TableSummaryDto, required: false })
  @Type(() => TableSummaryDto)
  @Expose()
  table?: TableSummaryDto;

  @ApiProperty({ type: DeliveryInfoSummaryDto, required: false })
  @Type(() => DeliveryInfoSummaryDto)
  @Expose()
  deliveryInfo?: DeliveryInfoSummaryDto;

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
  @Expose()
  preparationScreenStatuses?: Array<{ name: string; status: string }>;

  @ApiProperty({ 
    description: 'Cantidad de tickets impresos para esta orden', 
    required: false
  })
  @Expose()
  ticketImpressionCount?: number;
}
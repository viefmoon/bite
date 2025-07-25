import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { PreparationStatus } from '../../orders/domain/order-item';

export class KitchenOrderItemOptimizedDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  productName: string;

  @ApiProperty({ required: false })
  @Expose()
  variantName?: string;

  @ApiProperty({ type: [String] })
  @Expose()
  modifiers: string[];

  @ApiProperty({ type: [Object], required: false })
  @Expose()
  pizzaCustomizations?: any[];

  @ApiProperty({ required: false })
  @Expose()
  preparationNotes?: string;

  @ApiProperty({ enum: PreparationStatus })
  @Expose()
  preparationStatus: PreparationStatus;

  @ApiProperty({ required: false })
  @Expose()
  preparedAt?: Date;

  @ApiProperty({ required: false })
  @Expose()
  preparedByUser?: {
    firstName: string;
    lastName: string;
  };

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty()
  @Expose()
  belongsToMyScreen: boolean;
}

export class ScreenStatusOptimizedDto {
  @ApiProperty()
  @Expose()
  screenId: string;

  @ApiProperty()
  @Expose()
  screenName: string;

  @ApiProperty()
  @Expose()
  status: string;
}

export class KitchenOrderOptimizedDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  shiftOrderNumber: number;

  @ApiProperty({ enum: OrderType })
  @Expose()
  orderType: OrderType;

  @ApiProperty()
  @Expose()
  orderStatus: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty({ required: false })
  @Expose()
  orderNotes?: string;

  // Campos específicos según tipo de orden
  @ApiProperty({ required: false })
  @Expose()
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  @Expose()
  deliveryPhone?: string;

  @ApiProperty({ required: false })
  @Expose()
  receiptName?: string;

  @ApiProperty({ required: false })
  @Expose()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @Expose()
  areaName?: string;

  @ApiProperty({ required: false })
  @Expose()
  tableName?: string;

  @ApiProperty({ type: [KitchenOrderItemOptimizedDto] })
  @Expose()
  @Type(() => KitchenOrderItemOptimizedDto)
  items: KitchenOrderItemOptimizedDto[];

  @ApiProperty()
  @Expose()
  hasPendingItems: boolean;

  @ApiProperty({ type: [ScreenStatusOptimizedDto] })
  @Expose()
  @Type(() => ScreenStatusOptimizedDto)
  screenStatuses: ScreenStatusOptimizedDto[];

  @ApiProperty({ required: false })
  @Expose()
  myScreenStatus?: string;
}

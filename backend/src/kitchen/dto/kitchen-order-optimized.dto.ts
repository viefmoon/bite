import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { PreparationStatus } from '../../orders/domain/order-item';

export class KitchenOrderItemOptimizedDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productName: string;

  @ApiProperty({ required: false })
  variantName?: string;

  @ApiProperty({ type: [String] })
  modifiers: string[];

  @ApiProperty({ type: [Object], required: false })
  pizzaCustomizations?: any[];

  @ApiProperty({ required: false })
  preparationNotes?: string;

  @ApiProperty({ enum: PreparationStatus })
  preparationStatus: PreparationStatus;

  @ApiProperty({ required: false })
  preparedAt?: Date;

  @ApiProperty({ required: false })
  preparedByUser?: {
    firstName: string;
    lastName: string;
  };

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  belongsToMyScreen: boolean;
}

export class ScreenStatusOptimizedDto {
  @ApiProperty()
  screenId: string;

  @ApiProperty()
  screenName: string;

  @ApiProperty()
  status: string;
}

export class KitchenOrderOptimizedDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shiftOrderNumber: number;

  @ApiProperty({ enum: OrderType })
  orderType: OrderType;

  @ApiProperty()
  orderStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  orderNotes?: string;

  // Campos específicos según tipo de orden
  @ApiProperty({ required: false })
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  deliveryPhone?: string;

  @ApiProperty({ required: false })
  receiptName?: string;

  @ApiProperty({ required: false })
  customerPhone?: string;

  @ApiProperty({ required: false })
  areaName?: string;

  @ApiProperty({ required: false })
  tableName?: string;

  @ApiProperty({ type: [KitchenOrderItemOptimizedDto] })
  items: KitchenOrderItemOptimizedDto[];

  @ApiProperty()
  hasPendingItems: boolean;

  @ApiProperty({ type: [ScreenStatusOptimizedDto] })
  screenStatuses: ScreenStatusOptimizedDto[];

  @ApiProperty({ required: false })
  myScreenStatus?: string;
}

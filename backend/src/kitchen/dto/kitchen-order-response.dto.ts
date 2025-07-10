import { ApiProperty } from '@nestjs/swagger';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { PreparationStatus } from '../../orders/domain/order-item';

export class KitchenOrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  variantName?: string;

  @ApiProperty({ type: [String] })
  modifiers: string[];

  @ApiProperty({ type: [Object] })
  pizzaCustomizations: any[];

  @ApiProperty()
  preparationNotes?: string;

  @ApiProperty({ enum: PreparationStatus })
  preparationStatus: PreparationStatus;

  @ApiProperty()
  preparedAt?: Date;

  @ApiProperty()
  preparedBy?: string;

  @ApiProperty()
  preparedByUser?: {
    firstName: string;
    lastName: string;
  };

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  belongsToMyScreen: boolean;

  @ApiProperty()
  preparationScreenId?: string;
}

export class PreparationScreenStatusDto {
  @ApiProperty()
  screenId: string;

  @ApiProperty()
  screenName: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  startedAt?: Date;

  @ApiProperty({ required: false })
  completedAt?: Date;

  @ApiProperty({ required: false })
  startedBy?: {
    firstName: string;
    lastName: string;
  };
}

export class KitchenOrderDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dailyNumber: number;

  @ApiProperty({ enum: OrderType })
  orderType: OrderType;

  @ApiProperty()
  orderStatus: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
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

  @ApiProperty({ type: [KitchenOrderItemDto] })
  items: KitchenOrderItemDto[];

  @ApiProperty()
  hasPendingItems: boolean;

  @ApiProperty({ type: [PreparationScreenStatusDto] })
  screenStatuses: PreparationScreenStatusDto[];

  @ApiProperty()
  myScreenStatus?: string;
}

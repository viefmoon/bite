import { Order } from './order';
import { Product } from '../../products/domain/product';
import { ProductVariant } from '../../product-variants/domain/product-variant';
import { OrderItemModifier } from './order-item-modifier';
import { Adjustment } from '../../adjustments/domain/adjustment';

export enum PreparationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export class OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productVariantId: string | null;
  basePrice: number;
  finalPrice: number;
  preparationStatus: PreparationStatus;
  statusChangedAt: Date;
  preparationNotes: string | null;
  order?: Order;
  product?: Product;
  productVariant?: ProductVariant | null;
  modifiers?: OrderItemModifier[];
  adjustments?: Adjustment[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

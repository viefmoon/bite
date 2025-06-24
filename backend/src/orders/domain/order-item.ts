import { Order } from './order';
import { Product } from '../../products/domain/product';
import { ProductVariant } from '../../product-variants/domain/product-variant';
import { ProductModifier } from '../../product-modifiers/domain/product-modifier';
import { Adjustment } from '../../adjustments/domain/adjustment';
import { SelectedPizzaCustomization } from '../../selected-pizza-customizations/domain/selected-pizza-customization';

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
  productModifiers?: ProductModifier[];
  adjustments?: Adjustment[];
  selectedPizzaCustomizations?: SelectedPizzaCustomization[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

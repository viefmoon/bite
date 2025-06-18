import { OrderItem } from './order-item';

export class OrderItemModifier {
  id: string;
  orderItemId: string;
  productModifierId: string;
  quantity: number;
  price: number;
  orderItem?: OrderItem;
  productModifier?: any; // Información del modificador (ProductModifierEntity)
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

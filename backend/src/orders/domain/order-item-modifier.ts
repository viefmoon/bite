import { OrderItem } from './order-item';

export class OrderItemModifier {
  id: string;
  orderItemId: string;
  modifierId: string;
  modifierOptionId: string | null;
  quantity: number;
  price: number;
  orderItem?: OrderItem;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

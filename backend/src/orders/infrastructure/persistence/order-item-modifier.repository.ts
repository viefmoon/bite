import { OrderItemModifier } from '../../domain/order-item-modifier';

export interface OrderItemModifierRepository {
  findById(id: string): Promise<OrderItemModifier | null>;
  findByOrderItemId(orderItemId: string): Promise<OrderItemModifier[]>;
  save(orderItemModifier: OrderItemModifier): Promise<OrderItemModifier>;
  update(orderItemModifier: OrderItemModifier): Promise<OrderItemModifier>;
  delete(id: string): Promise<void>;
}

import { OrderItem } from '../../domain/order-item';

export interface OrderItemRepository {
  findById(id: string): Promise<OrderItem | null>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
  save(orderItem: OrderItem): Promise<OrderItem>;
  update(orderItem: OrderItem): Promise<OrderItem>;
  delete(id: string): Promise<void>;
}

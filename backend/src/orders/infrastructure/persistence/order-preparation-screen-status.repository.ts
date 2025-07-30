import { OrderPreparationScreenStatus } from '../../domain/order-preparation-screen-status';

export abstract class OrderPreparationScreenStatusRepository {
  abstract create(
    data: Omit<OrderPreparationScreenStatus, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<OrderPreparationScreenStatus>;

  abstract findByOrderId(
    orderId: string,
  ): Promise<OrderPreparationScreenStatus[]>;

  abstract findByOrderAndScreen(
    orderId: string,
    screenId: string,
  ): Promise<OrderPreparationScreenStatus | null>;

  abstract update(
    id: string,
    data: Partial<OrderPreparationScreenStatus>,
  ): Promise<OrderPreparationScreenStatus>;

  abstract createOrUpdate(
    orderId: string,
    screenId: string,
    data: Partial<OrderPreparationScreenStatus>,
  ): Promise<OrderPreparationScreenStatus>;

  abstract deleteByOrderId(orderId: string): Promise<void>;

  abstract remove(id: string): Promise<void>;
}

// src/orders/infrastructure/persistence/order-item-history.repository.ts
import { OrderItemHistoryEntity } from './relational/entities/order-item-history.entity';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class OrderItemHistoryRepository {
  // No necesitamos 'create'

  /**
   * Busca registros de historial para un item de orden específico, con paginación.
   * @param orderItemId - El ID del item de la orden.
   * @param paginationOptions - Opciones de paginación (page, limit).
   * @returns Una tupla con la lista de registros de historial y el conteo total.
   */
  abstract findByOrderItemId(
    orderItemId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderItemHistoryEntity[], number]>;

  /**
   * Busca registros de historial para todos los items de una orden específica, con paginación.
   * @param orderId - El ID de la orden.
   * @param paginationOptions - Opciones de paginación (page, limit).
   * @returns Una tupla con la lista de registros de historial y el conteo total.
   */
  abstract findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderItemHistoryEntity[], number]>;
}

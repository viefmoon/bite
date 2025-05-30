import { OrderHistoryEntity } from './relational/entities/order-history.entity';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class OrderHistoryRepository {

  /**
   * Busca registros de historial para una orden específica, con paginación.
   * @param orderId
   * @param paginationOptions
   * @returns
   */
  abstract findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderHistoryEntity[], number]>;
}

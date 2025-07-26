import { OrderHistoryEntity } from './relational/entities/order-history.entity';
import { IPaginationOptions } from '../../../utils/types/pagination-options';

export abstract class OrderHistoryRepository {
  abstract findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderHistoryEntity[], number]>;
}

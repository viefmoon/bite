import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Order } from '../../domain/order';
import { FindAllOrdersDto } from '../../dto/find-all-orders.dto';
import { DeliveryInfo } from '../../domain/delivery-info';

export abstract class OrderRepository {
  abstract create(data: {
    userId: string | null;
    tableId: string | null;
    shiftId?: string | null;
    scheduledAt?: Date | null;
    orderStatus: string;
    orderType: string;
    subtotal: number;
    total: number;
    notes?: string;
    customerId?: string | null;
    isFromWhatsApp?: boolean;
    deliveryInfo: DeliveryInfo | null;
    estimatedDeliveryTime?: Date | null;
  }): Promise<Order>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllOrdersDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[Order[], number]>;

  abstract findById(id: Order['id']): Promise<NullableType<Order>>;
  abstract findByUserId(userId: Order['userId']): Promise<Order[]>;
  abstract findByTableId(tableId: Order['tableId']): Promise<Order[]>;
  abstract findByShiftId(shiftId: Order['shiftId']): Promise<Order[]>;
  abstract findByShiftIdForSummary(shiftId: Order['shiftId']): Promise<Order[]>;
  abstract findOpenOrdersByDate(date: Date): Promise<Order[]>;
  abstract findOrderForFinalizationById(id: string): Promise<Order | null>;
  abstract findByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
  abstract findOpenOrdersOptimized(
    startDate: Date,
    endDate: Date,
  ): Promise<Order[]>;
  abstract findByStatus(statuses: string[]): Promise<Order[]>;

  abstract update(
    id: Order['id'],
    payload: DeepPartial<Order>,
  ): Promise<Order | null>;

  abstract remove(id: Order['id']): Promise<void>;
}

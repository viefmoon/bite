import { NullableType } from '../../../utils/types/nullable.type';
import { DailyOrderCounter } from '../../domain/daily-order-counter';

export abstract class DailyOrderCounterRepository {
  abstract create(
    data: Omit<
      DailyOrderCounter,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'orders'
    >,
  ): Promise<DailyOrderCounter>;

  abstract findById(
    id: DailyOrderCounter['id'],
  ): Promise<NullableType<DailyOrderCounter>>;
  abstract findByDate(date: Date): Promise<NullableType<DailyOrderCounter>>;
  abstract findOrCreateByDate(date: Date): Promise<DailyOrderCounter>;

  abstract incrementCounter(
    id: DailyOrderCounter['id'],
  ): Promise<DailyOrderCounter>;

  abstract update(
    id: DailyOrderCounter['id'],
    payload: Partial<DailyOrderCounter>,
  ): Promise<DailyOrderCounter>;

  abstract remove(id: DailyOrderCounter['id']): Promise<void>;
}

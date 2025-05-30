import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DailyOrderCounter } from '../../../../domain/daily-order-counter';
import { DailyOrderCounterEntity } from '../entities/daily-order-counter.entity';
import { OrderMapper } from './order.mapper';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class DailyOrderCounterMapper extends BaseMapper<DailyOrderCounterEntity, DailyOrderCounter> {
  constructor(
    @Inject(forwardRef(() => OrderMapper)) 
    private readonly orderMapper: OrderMapper) {
    super();
  }

  override toDomain(entity: DailyOrderCounterEntity): DailyOrderCounter | null {
    if (!entity) return null;
    const domain = new DailyOrderCounter();
    domain.id = entity.id;
    domain.date = entity.date;
    domain.currentNumber = entity.currentNumber;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.orders = mapArray(entity.orders, (order) => this.orderMapper.toDomain(order));
    return domain;
  }

  override toEntity(domain: DailyOrderCounter): DailyOrderCounterEntity | null {
    if (!domain) return null;
    const entity = new DailyOrderCounterEntity();
    if (domain.id) entity.id = domain.id;
    entity.date = domain.date;
    entity.currentNumber = domain.currentNumber;

    return entity;
  }
}

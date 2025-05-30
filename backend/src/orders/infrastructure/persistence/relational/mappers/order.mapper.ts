import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../../domain/order';
import { OrderEntity } from '../entities/order.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { TableMapper } from '../../../../../tables/infrastructure/persistence/relational/mappers/table.mapper';
import { DailyOrderCounterMapper } from './daily-order-counter.mapper';
import { OrderItemMapper } from './order-item.mapper';
import { PaymentMapper } from '../../../../../payments/infrastructure/persistence/relational/mappers/payment.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TableEntity } from '../../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { DailyOrderCounterEntity } from '../entities/daily-order-counter.entity';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class OrderMapper extends BaseMapper<OrderEntity, Order> {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly tableMapper: TableMapper,
    private readonly dailyOrderCounterMapper: DailyOrderCounterMapper,
    private readonly orderItemMapper: OrderItemMapper,
    @Inject(forwardRef(() => PaymentMapper))
    private readonly paymentMapper: PaymentMapper,
  ) {
    super();
  }

  override toDomain(entity: OrderEntity): Order | null {
    if (!entity) return null;
    const domain = new Order();
    domain.id = entity.id;
    domain.dailyNumber = entity.dailyNumber;
    domain.dailyOrderCounterId = entity.dailyOrderCounterId;
    domain.userId = entity.userId;
    domain.tableId = entity.tableId;
    domain.orderStatus = entity.orderStatus;
    domain.orderType = entity.orderType;
    domain.total = entity.total;
    domain.notes = entity.notes || undefined;
    domain.phoneNumber = entity.phoneNumber;
    domain.customerName = entity.customerName;
    domain.deliveryAddress = entity.deliveryAddress;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.user = this.userMapper.toDomain(entity.user!)!;
    domain.table = entity.table ? this.tableMapper.toDomain(entity.table) : null;
    domain.dailyOrderCounter = this.dailyOrderCounterMapper.toDomain(entity.dailyOrderCounter!)!;

    domain.orderItems = mapArray(entity.orderItems, (item) =>
      this.orderItemMapper.toDomain(item),
    );
    domain.payments = mapArray(entity.payments, (payment) =>
      this.paymentMapper.toDomain(payment),
    );

    return domain;
  }

  override toEntity(domain: Order): OrderEntity | null {
    if (!domain) return null;
    const entity = new OrderEntity();
    if (domain.id) entity.id = domain.id;
    entity.dailyNumber = domain.dailyNumber;
    entity.dailyOrderCounter = {
      id: domain.dailyOrderCounterId,
    } as DailyOrderCounterEntity;
    entity.user = { id: domain.userId } as UserEntity;
    entity.table = domain.tableId ? ({ id: domain.tableId } as TableEntity) : null;
    entity.orderStatus = domain.orderStatus;
    entity.orderType = domain.orderType;
    entity.total = domain.total;
    entity.notes = domain.notes || null;
    entity.phoneNumber = domain.phoneNumber || null;
    entity.customerName = domain.customerName || null;
    entity.deliveryAddress = domain.deliveryAddress || null;

    return entity;
  }
}

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../../domain/order';
import { OrderEntity } from '../entities/order.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { TableMapper } from '../../../../../tables/infrastructure/persistence/relational/mappers/table.mapper';
import { DailyOrderCounterMapper } from './daily-order-counter.mapper';
import { OrderItemMapper } from './order-item.mapper';
import { PaymentMapper } from '../../../../../payments/infrastructure/persistence/relational/mappers/payment.mapper';
import { AdjustmentMapper } from '../../../../../adjustments/infrastructure/persistence/relational/mappers/adjustment.mapper';
import { DeliveryInfoMapper } from './delivery-info.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TableEntity } from '../../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { DailyOrderCounterEntity } from '../entities/daily-order-counter.entity';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';

@Injectable()
export class OrderMapper extends BaseMapper<OrderEntity, Order> {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly tableMapper: TableMapper,
    private readonly dailyOrderCounterMapper: DailyOrderCounterMapper,
    private readonly orderItemMapper: OrderItemMapper,
    @Inject(forwardRef(() => PaymentMapper))
    private readonly paymentMapper: PaymentMapper,
    @Inject(forwardRef(() => AdjustmentMapper))
    private readonly adjustmentMapper: AdjustmentMapper,
    private readonly deliveryInfoMapper: DeliveryInfoMapper,
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
    domain.subtotal = entity.subtotal;
    domain.total = entity.total;
    domain.notes = entity.notes || undefined;
    domain.customerId = entity.customerId;
    domain.isFromWhatsApp = entity.isFromWhatsApp;
    domain.scheduledAt = entity.scheduledAt;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.user = entity.user ? this.userMapper.toDomain(entity.user) : null;
    domain.table = entity.table
      ? this.tableMapper.toDomain(entity.table)
      : null;
    domain.dailyOrderCounter = this.dailyOrderCounterMapper.toDomain(
      entity.dailyOrderCounter!,
    )!;

    domain.orderItems = mapArray(entity.orderItems, (item) =>
      this.orderItemMapper.toDomain(item),
    );
    domain.payments = mapArray(entity.payments, (payment) =>
      this.paymentMapper.toDomain(payment),
    );

    domain.adjustments = mapArray(entity.adjustments, (adjustment) =>
      this.adjustmentMapper.toDomain(adjustment),
    );

    domain.deliveryInfo = this.deliveryInfoMapper.toDomain(
      entity.deliveryInfo!,
    )!;
    domain.estimatedDeliveryTime = entity.estimatedDeliveryTime;

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
    entity.userId = domain.userId;
    entity.user = domain.userId ? ({ id: domain.userId } as UserEntity) : null;
    entity.table = domain.tableId
      ? ({ id: domain.tableId } as TableEntity)
      : null;
    entity.orderStatus = domain.orderStatus;
    entity.orderType = domain.orderType;
    entity.subtotal = domain.subtotal;
    entity.total = domain.total;
    entity.notes = domain.notes || null;
    entity.customerId = domain.customerId || null;
    entity.isFromWhatsApp = domain.isFromWhatsApp || false;
    entity.scheduledAt = domain.scheduledAt || null;
    entity.estimatedDeliveryTime = domain.estimatedDeliveryTime || null;

    return entity;
  }
}

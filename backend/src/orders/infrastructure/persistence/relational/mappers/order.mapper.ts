import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Order } from '../../../../domain/order';
import { OrderEntity } from '../entities/order.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { TableMapper } from '../../../../../tables/infrastructure/persistence/relational/mappers/table.mapper';
import { OrderItemMapper } from './order-item.mapper';
import { PaymentMapper } from '../../../../../payments/infrastructure/persistence/relational/mappers/payment.mapper';
import { AdjustmentMapper } from '../../../../../adjustments/infrastructure/persistence/relational/mappers/adjustment.mapper';
import { DeliveryInfoMapper } from './delivery-info.mapper';
import { OrderPreparationScreenStatusMapper } from './order-preparation-screen-status.mapper';
import { TicketImpressionMapper } from './ticket-impression.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TableEntity } from '../../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { ShiftEntity } from '../../../../../shifts/infrastructure/persistence/relational/entities/shift.entity';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';

@Injectable()
export class OrderMapper extends BaseMapper<OrderEntity, Order> {
  constructor(
    private readonly userMapper: UserMapper,
    private readonly tableMapper: TableMapper,
    private readonly orderItemMapper: OrderItemMapper,
    @Inject(forwardRef(() => PaymentMapper))
    private readonly paymentMapper: PaymentMapper,
    @Inject(forwardRef(() => AdjustmentMapper))
    private readonly adjustmentMapper: AdjustmentMapper,
    private readonly deliveryInfoMapper: DeliveryInfoMapper,
    private readonly orderPreparationScreenStatusMapper: OrderPreparationScreenStatusMapper,
    private readonly ticketImpressionMapper: TicketImpressionMapper,
  ) {
    super();
  }

  override toDomain(entity: OrderEntity): Order | null {
    if (!entity) return null;
    const domain = new Order();
    domain.id = entity.id;
    domain.shiftOrderNumber = entity.shiftOrderNumber;
    domain.shiftId = entity.shiftId;
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
    domain.finalizedAt = entity.finalizedAt;
    domain.user = entity.user ? this.userMapper.toDomain(entity.user) : null;
    domain.table = entity.table
      ? this.tableMapper.toDomain(entity.table)
      : null;

    domain.orderItems = mapArray(entity.orderItems, (item) =>
      this.orderItemMapper.toDomain(item),
    );
    domain.payments = mapArray(entity.payments, (payment) =>
      this.paymentMapper.toDomain(payment),
    );

    domain.adjustments = mapArray(entity.adjustments, (adjustment) =>
      this.adjustmentMapper.toDomain(adjustment),
    );

    domain.deliveryInfo = entity.deliveryInfo
      ? this.deliveryInfoMapper.toDomain(entity.deliveryInfo)
      : null;
    domain.estimatedDeliveryTime = entity.estimatedDeliveryTime;

    domain.preparationScreenStatusesFull = mapArray(
      entity.preparationScreenStatuses,
      (status) => this.orderPreparationScreenStatusMapper.toDomain(status),
    );

    domain.ticketImpressions = mapArray(
      entity.ticketImpressions,
      (impression) => this.ticketImpressionMapper.toDomain(impression),
    );

    return domain;
  }

  override toEntity(domain: Order): OrderEntity | null {
    if (!domain) return null;
    const entity = new OrderEntity();
    if (domain.id) entity.id = domain.id;
    entity.shiftOrderNumber = domain.shiftOrderNumber;
    entity.shiftId = domain.shiftId;
    entity.shift = {
      id: domain.shiftId,
    } as ShiftEntity;
    entity.userId = domain.userId;
    entity.user = domain.userId ? ({ id: domain.userId } as UserEntity) : null;
    entity.tableId = domain.tableId || null;
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
    entity.finalizedAt = domain.finalizedAt || null;

    // Mapear deliveryInfo si existe
    if (domain.deliveryInfo) {
      entity.deliveryInfo = this.deliveryInfoMapper.toEntity(
        domain.deliveryInfo,
      );
    } else {
      entity.deliveryInfo = null;
    }

    return entity;
  }
}

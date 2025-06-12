import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { Adjustment } from '../../../../domain/adjustment';
import { AdjustmentEntity } from '../entities/adjustment.entity';
import { OrderMapper } from '../../../../../orders/infrastructure/persistence/relational/mappers/order.mapper';
import { OrderItemMapper } from '../../../../../orders/infrastructure/persistence/relational/mappers/order-item.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';

@Injectable()
export class AdjustmentMapper extends BaseMapper<AdjustmentEntity, Adjustment> {
  constructor(
    @Inject(forwardRef(() => OrderMapper))
    private readonly orderMapper: OrderMapper,
    @Inject(forwardRef(() => OrderItemMapper))
    private readonly orderItemMapper: OrderItemMapper,
    @Inject(forwardRef(() => UserMapper))
    private readonly userMapper: UserMapper,
  ) {
    super();
  }

  toDomain(entity: AdjustmentEntity | null): Adjustment | null {
    if (!entity) {
      return null;
    }

    const domain = new Adjustment();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.orderItemId = entity.orderItemId;
    domain.name = entity.name;
    domain.isPercentage = entity.isPercentage;
    domain.value = Number(entity.value);
    domain.amount = Number(entity.amount);
    domain.appliedById = entity.appliedById;
    domain.appliedAt = entity.appliedAt;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    // Map relations if loaded
    if (entity.order) {
      domain.order = this.orderMapper.toDomain(entity.order);
    }
    if (entity.orderItem) {
      domain.orderItem = this.orderItemMapper.toDomain(entity.orderItem);
    }
    if (entity.appliedBy) {
      domain.appliedBy = this.userMapper.toDomain(entity.appliedBy);
    }

    return domain;
  }

  toEntity(domain: Adjustment | null): AdjustmentEntity | null {
    if (!domain) {
      return null;
    }

    const entity = new AdjustmentEntity();
    entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.orderItemId = domain.orderItemId;
    entity.name = domain.name;
    entity.isPercentage = domain.isPercentage;
    entity.value = domain.value;
    entity.amount = domain.amount;
    entity.appliedById = domain.appliedById;
    entity.appliedAt = domain.appliedAt;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;

    // Relations are typically not mapped back to entity
    // They should be handled separately to avoid circular dependencies

    return entity;
  }
}

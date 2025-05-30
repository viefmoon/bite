import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { OrderItemEntity } from '../entities/order-item.entity';
import { ProductModifierEntity } from '../../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';
import { OrderItemModifier } from '../../../../domain/order-item-modifier';
import { OrderItemModifierEntity } from '../entities/order-item-modifier.entity';
import { OrderItemMapper } from './order-item.mapper';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class OrderItemModifierMapper extends BaseMapper<OrderItemModifierEntity, OrderItemModifier> {
  constructor(
    @Inject(forwardRef(() => OrderItemMapper))
    private readonly orderItemMapper: OrderItemMapper,
  ) {
    super();
  }

  override toDomain(entity: OrderItemModifierEntity): OrderItemModifier | null {
    if (!entity) return null;

    const orderItemDomain = this.orderItemMapper.toDomain(entity.orderItem!)!;

    const domain = new OrderItemModifier();
    domain.id = entity.id;
    domain.orderItemId = entity.orderItemId;
    domain.modifierId = entity.modifierId;
    domain.modifierOptionId = entity.modifierOptionId;
    domain.quantity = entity.quantity;
    domain.price = entity.price;
    domain.orderItem = orderItemDomain;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: OrderItemModifier): OrderItemModifierEntity | null {
    if (!domain) return null;
    const entity = new OrderItemModifierEntity();
    if (domain.id) entity.id = domain.id;
    entity.orderItem = { id: domain.orderItemId } as OrderItemEntity;
    entity.modifier = { id: domain.modifierId } as ProductModifierEntity;
    entity.modifierOptionId = domain.modifierOptionId;
    entity.quantity = domain.quantity;
    entity.price = domain.price;

    return entity;
  }
}

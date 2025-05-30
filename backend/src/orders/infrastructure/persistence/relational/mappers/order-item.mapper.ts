import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OrderItem } from '../../../../domain/order-item';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderMapper } from './order.mapper';
import { OrderItemModifierMapper } from './order-item-modifier.mapper';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { ProductVariantMapper } from '../../../../../product-variants/infrastructure/persistence/relational/mappers/product-variant.mapper';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class OrderItemMapper extends BaseMapper<OrderItemEntity, OrderItem> {
  constructor(
    @Inject(forwardRef(() => OrderMapper))
    private readonly orderMapper: OrderMapper,
    private readonly orderItemModifierMapper: OrderItemModifierMapper,
    private readonly productMapper: ProductMapper,
    private readonly productVariantMapper: ProductVariantMapper,
  ) {
    super();
  }

  override toDomain(entity: OrderItemEntity): OrderItem | null {
    if (!entity) return null;
    const domain = new OrderItem();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.order = this.orderMapper.toDomain(entity.order!)!;
    domain.productId = entity.productId;
    domain.product = this.productMapper.toDomain(entity.product!)!;
    domain.productVariantId = entity.productVariantId;
    domain.productVariant = this.productVariantMapper.toDomain(entity.productVariant!)!;
    domain.quantity = entity.quantity;
    domain.basePrice = entity.basePrice;
    domain.finalPrice = entity.finalPrice;
    domain.preparationStatus = entity.preparationStatus;
    domain.statusChangedAt = entity.statusChangedAt;
    domain.preparationNotes = entity.preparationNotes;
    domain.modifiers = mapArray(entity.modifiers, (mod) => this.orderItemModifierMapper.toDomain(mod));
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: OrderItem): OrderItemEntity | null {
    if (!domain) return null;
    const entity = new OrderItemEntity();
    if (domain.id) entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.productId = domain.productId;
    entity.productVariantId = domain.productVariantId;
    entity.quantity = domain.quantity;
    entity.basePrice = domain.basePrice;
    entity.finalPrice = domain.finalPrice;
    entity.preparationStatus = domain.preparationStatus;
    entity.statusChangedAt = domain.statusChangedAt;
    entity.preparationNotes = domain.preparationNotes;
    return entity;
  }
}

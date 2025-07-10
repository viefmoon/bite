import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { OrderItem } from '../../../../domain/order-item';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderEntity } from '../entities/order.entity';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { ProductVariantEntity } from '../../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { OrderMapper } from './order.mapper';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { ProductVariantMapper } from '../../../../../product-variants/infrastructure/persistence/relational/mappers/product-variant.mapper';
import { ProductModifierMapper } from '../../../../../product-modifiers/infrastructure/persistence/relational/mappers/product-modifier.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';
import { SelectedPizzaCustomizationEntity } from '../../../../../selected-pizza-customizations/infrastructure/persistence/relational/entities/selected-pizza-customization.entity';
import { SelectedPizzaCustomization } from '../../../../../selected-pizza-customizations/domain/selected-pizza-customization';

@Injectable()
export class OrderItemMapper extends BaseMapper<OrderItemEntity, OrderItem> {
  constructor(
    @Inject(forwardRef(() => OrderMapper))
    private readonly orderMapper: OrderMapper,
    private readonly productMapper: ProductMapper,
    private readonly productVariantMapper: ProductVariantMapper,
    private readonly productModifierMapper: ProductModifierMapper,
    private readonly userMapper: UserMapper,
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
    domain.productVariant = this.productVariantMapper.toDomain(
      entity.productVariant!,
    )!;
    domain.basePrice = entity.basePrice;
    domain.finalPrice = entity.finalPrice;
    domain.preparationStatus = entity.preparationStatus;
    domain.statusChangedAt = entity.statusChangedAt;
    domain.preparationNotes = entity.preparationNotes;
    domain.preparedAt = entity.preparedAt;
    domain.preparedById = entity.preparedById;
    domain.preparedBy = entity.preparedBy
      ? this.userMapper.toDomain(entity.preparedBy)
      : null;
    domain.productModifiers = mapArray(entity.productModifiers, (mod) =>
      this.productModifierMapper.toDomain(mod),
    );

    // Mapear selectedPizzaCustomizations
    if (entity.selectedPizzaCustomizations) {
      domain.selectedPizzaCustomizations =
        entity.selectedPizzaCustomizations.map((customization) => {
          const domainCustomization = new SelectedPizzaCustomization();
          domainCustomization.id = customization.id;
          domainCustomization.orderItemId = customization.orderItemId;
          domainCustomization.pizzaCustomizationId =
            customization.pizzaCustomizationId;
          domainCustomization.half = customization.half;
          domainCustomization.action = customization.action;
          domainCustomization.createdAt = customization.createdAt;
          domainCustomization.updatedAt = customization.updatedAt;
          domainCustomization.deletedAt = customization.deletedAt;

          // Incluir información de pizzaCustomization si está disponible
          if (customization.pizzaCustomization) {
            domainCustomization.pizzaCustomization = {
              id: customization.pizzaCustomization.id,
              name: customization.pizzaCustomization.name,
              type: customization.pizzaCustomization.type,
              ingredients: customization.pizzaCustomization.ingredients,
              toppingValue: customization.pizzaCustomization.toppingValue,
              isActive: customization.pizzaCustomization.isActive,
              sortOrder: customization.pizzaCustomization.sortOrder,
            } as any;
          }

          return domainCustomization;
        });
    }

    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: OrderItem): OrderItemEntity | null {
    if (!domain) return null;
    const entity = new OrderItemEntity();
    if (domain.id) entity.id = domain.id;

    // Set the foreign key relations using objects with IDs
    if (domain.orderId) {
      entity.order = { id: domain.orderId } as OrderEntity;
    }
    if (domain.productId) {
      entity.product = { id: domain.productId } as ProductEntity;
    }
    if (domain.productVariantId) {
      entity.productVariant = {
        id: domain.productVariantId,
      } as ProductVariantEntity;
    }

    entity.basePrice = domain.basePrice;
    entity.finalPrice = domain.finalPrice;
    entity.preparationStatus = domain.preparationStatus;
    entity.statusChangedAt = domain.statusChangedAt;
    entity.preparationNotes = domain.preparationNotes;
    entity.preparedAt = domain.preparedAt || null;
    entity.preparedById = domain.preparedById || null;

    // Mapear productModifiers
    if (domain.productModifiers) {
      entity.productModifiers = domain.productModifiers.map((modifier) => {
        // Si el modifier es un objeto con id, usarlo directamente
        if (typeof modifier === 'object' && 'id' in modifier) {
          return { id: modifier.id } as any;
        }
        // Si es un string (ID), crear objeto con id
        if (typeof modifier === 'string') {
          return { id: modifier } as any;
        }
        return modifier;
      });
    }

    // Mapear selectedPizzaCustomizations
    if (domain.selectedPizzaCustomizations) {
      entity.selectedPizzaCustomizations =
        domain.selectedPizzaCustomizations.map((customization) => {
          const entityCustomization = new SelectedPizzaCustomizationEntity();
          if (customization.id) entityCustomization.id = customization.id;
          entityCustomization.orderItemId = customization.orderItemId;
          entityCustomization.pizzaCustomizationId =
            customization.pizzaCustomizationId;
          entityCustomization.half = customization.half;
          entityCustomization.action = customization.action;
          return entityCustomization;
        });
    }

    return entity;
  }
}

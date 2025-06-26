import { Injectable } from '@nestjs/common';
import { PizzaCustomization } from '../../../../domain/pizza-customization';
import { PizzaCustomizationEntity } from '../entities/pizza-customization.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class PizzaCustomizationMapper extends BaseMapper<
  PizzaCustomizationEntity,
  PizzaCustomization
> {
  override toDomain(
    entity: PizzaCustomizationEntity,
  ): PizzaCustomization | null {
    if (!entity) return null;
    const domain = new PizzaCustomization();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.type = entity.type;
    domain.ingredients = entity.ingredients;
    domain.toppingValue = entity.toppingValue;
    domain.isActive = entity.isActive;
    domain.sortOrder = entity.sortOrder;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    if (entity.products) {
      domain.productIds = entity.products.map((product) => product.id);
      domain.products = entity.products.map((product) => ({
        id: product.id,
        name: product.name,
      }));
    }

    return domain;
  }

  override toEntity(
    domain: PizzaCustomization,
  ): PizzaCustomizationEntity | null {
    if (!domain) return null;
    const entity = new PizzaCustomizationEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.type = domain.type;
    entity.ingredients = domain.ingredients || null;
    entity.toppingValue = domain.toppingValue;
    entity.isActive = domain.isActive;
    entity.sortOrder = domain.sortOrder;
    return entity;
  }
}

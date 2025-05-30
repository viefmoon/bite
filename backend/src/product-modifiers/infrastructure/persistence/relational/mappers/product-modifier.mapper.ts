import { Injectable } from '@nestjs/common';
import { ProductModifier } from '../../../../domain/product-modifier';
import { ProductModifierEntity } from '../entities/product-modifier.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { ModifierGroupEntity } from '../../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';

@Injectable()
export class ProductModifierMapper extends BaseMapper<ProductModifierEntity, ProductModifier> {
  override toDomain(entity: ProductModifierEntity): ProductModifier | null {
    if (!entity) return null;
    const domain = new ProductModifier();
    domain.id = entity.id;
    domain.groupId = entity.groupId;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.price = entity.price;
    domain.sortOrder = entity.sortOrder;
    domain.isDefault = entity.isDefault;
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: ProductModifier): ProductModifierEntity | null {
     if (!domain) return null;
    const entity = new ProductModifierEntity();
    if (domain.id) entity.id = domain.id;
    entity.groupId = domain.groupId;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.price = domain.price;
    entity.sortOrder = domain.sortOrder;
    entity.isDefault = domain.isDefault;
    entity.isActive = domain.isActive;

    if (domain.groupId) {
       entity.group = { id: domain.groupId } as ModifierGroupEntity;
    }
    return entity;
  }
}

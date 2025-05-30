import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ModifierGroup } from '../../../../domain/modifier-group';
import { ModifierGroupEntity } from '../entities/modifier-group.entity';
import { ProductModifierMapper } from '../../../../../product-modifiers/infrastructure/persistence/relational/mappers/product-modifier.mapper';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Injectable()
export class ModifierGroupMapper extends BaseMapper<ModifierGroupEntity, ModifierGroup> {
  constructor(
    private readonly productModifierMapper: ProductModifierMapper,
    @Inject(forwardRef(() => ProductMapper))
    private readonly productMapper: ProductMapper,
  ) {
    super();
  }

  override toDomain(entity: ModifierGroupEntity): ModifierGroup | null {
    if (!entity) return null;
    const domain = new ModifierGroup();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.minSelections = entity.minSelections;
    domain.maxSelections = entity.maxSelections;
    domain.isRequired = entity.isRequired;
    domain.allowMultipleSelections = entity.allowMultipleSelections;
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.productModifiers = mapArray(entity.productModifiers, (modifier) => this.productModifierMapper.toDomain(modifier));
    domain.products = mapArray(entity.products, (product) => this.productMapper.toEntity(product));
    return domain;
  }

  override toEntity(domain: ModifierGroup): ModifierGroupEntity | null {
    if (!domain) return null;
    const entity = new ModifierGroupEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.minSelections = domain.minSelections;
    entity.maxSelections = domain.maxSelections;
    entity.isRequired = domain.isRequired;
    entity.allowMultipleSelections = domain.allowMultipleSelections;
    entity.isActive = domain.isActive;
    entity.products = mapArray(domain.products, (product) => this.productMapper.toEntity(product)) as ProductEntity[];
    return entity;
  }
}

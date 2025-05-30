import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PreparationScreen } from '../../../../domain/preparation-screen';
import { PreparationScreenEntity } from '../entities/preparation-screen.entity';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Injectable()
export class PreparationScreenMapper extends BaseMapper<PreparationScreenEntity, PreparationScreen> {
  constructor(
    @Inject(forwardRef(() => ProductMapper))
    private readonly productMapper: ProductMapper,
  ) {
    super();
  }

  override toDomain(entity: PreparationScreenEntity): PreparationScreen | null {
    if (!entity) return null;
    const domain = new PreparationScreen();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.isActive = entity.isActive;
    domain.products = mapArray(entity.products, (p) => this.productMapper.toDomain(p));
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: PreparationScreen): PreparationScreenEntity | null {
    if (!domain) return null;
    const entity = new PreparationScreenEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;

    if (domain.products) {
      entity.products = mapArray(domain.products, (p) => this.productMapper.toEntity(p) as ProductEntity);
    }

    return entity;
  }
}

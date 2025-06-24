import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ProductVariant } from '../../../../domain/product-variant';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class ProductVariantMapper extends BaseMapper<
  ProductVariantEntity,
  ProductVariant
> {
  constructor(
    @Inject(forwardRef(() => ProductMapper))
    private readonly productMapper: ProductMapper,
  ) {
    super();
  }

  override toDomain(entity: ProductVariantEntity): ProductVariant | null {
    if (!entity) return null;
    const domain = new ProductVariant();
    domain.id = entity.id;
    // Si product existe, usar su id, sino usar productId del RelationId
    domain.productId = entity.product?.id || entity.productId;
    domain.name = entity.name;
    domain.price = entity.price;
    domain.isActive = entity.isActive;
    domain.sortOrder = entity.sortOrder;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    // Solo mapear product si existe
    if (entity.product) {
      const mappedProduct = this.productMapper.toDomain(entity.product);
      if (mappedProduct) {
        domain.product = mappedProduct;
      }
    }
    return domain;
  }

  override toEntity(domain: ProductVariant): ProductVariantEntity | null {
    if (!domain) return null;
    const entity = new ProductVariantEntity();
    entity.id = domain.id;
    entity.product = { id: domain.productId } as ProductEntity;
    entity.name = domain.name;
    entity.price = domain.price;
    entity.isActive = domain.isActive;
    entity.sortOrder = domain.sortOrder;

    return entity;
  }
}

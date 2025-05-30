import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Subcategory } from '../../../../domain/subcategory';
import { SubcategoryEntity } from '../entities/subcategory.entity';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { CategoryMapper } from '../../../../../categories/infrastructure/persistence/relational/mappers/category.mapper';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class SubcategoryMapper extends BaseMapper<SubcategoryEntity, Subcategory> {
  constructor(
    @Inject(forwardRef(() => CategoryMapper))
    private readonly categoryMapper: CategoryMapper,
    private readonly fileMapper: FileMapper,
    @Inject(forwardRef(() => ProductMapper))
    private readonly productMapper: ProductMapper,
  ) {
    super();
  }

  override toDomain(entity: SubcategoryEntity): Subcategory | null {
    if (!entity) return null;
    const domain = new Subcategory();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.isActive = entity.isActive;
    domain.categoryId = entity.categoryId;
    domain.photoId = entity.photoId;
    domain.category = entity.category ? this.categoryMapper.toDomain(entity.category) : null;
    domain.photo = entity.photo ? this.fileMapper.toDomain(entity.photo) : null;
    domain.products = mapArray(entity.products, (p) => this.productMapper.toDomain(p));
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: Subcategory): SubcategoryEntity | null {
    if (!domain) return null;
    const entity = new SubcategoryEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;
    entity.category = { id: domain.categoryId } as CategoryEntity;
    entity.photo = domain.photoId ? ({ id: domain.photoId } as FileEntity) : null;
    return entity;
  }
}

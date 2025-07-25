import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Category } from '../../../../domain/category';
import { CategoryEntity } from '../entities/category.entity';
import { FileMapper } from '../../../../../files/infrastructure/persistence/relational/mappers/file.mapper';
import { SubcategoryMapper } from '../../../../../subcategories/infrastructure/persistence/relational/mappers/subcategory.mapper';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';

@Injectable()
export class CategoryMapper extends BaseMapper<CategoryEntity, Category> {
  constructor(
    @Inject(forwardRef(() => SubcategoryMapper))
    private readonly subcategoryMapper: SubcategoryMapper,
    private readonly fileMapper: FileMapper,
  ) {
    super();
  }

  override toDomain(entity: CategoryEntity): Category | null {
    if (!entity) return null;
    const domain = new Category();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.isActive = entity.isActive;
    domain.sortOrder = entity.sortOrder;
    domain.photoId = entity.photoId;
    domain.photo = entity.photo ? this.fileMapper.toDomain(entity.photo) : null;
    domain.subcategories = mapArray(entity.subcategories, (sub) =>
      this.subcategoryMapper.toDomain(sub),
    );
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: Category): CategoryEntity | null {
    if (!domain) return null;
    const entity = new CategoryEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;
    entity.sortOrder = domain.sortOrder;
    // Solo asignar photoId si está presente en el DTO
    if (domain.photoId !== undefined) {
      entity.photoId = domain.photoId;
    }
    // No asignar photo directamente, dejar que TypeORM maneje la relación
    return entity;
  }
}

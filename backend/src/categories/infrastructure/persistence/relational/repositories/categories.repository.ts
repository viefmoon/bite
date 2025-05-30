import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { Category } from '../../../../domain/category';
import { CategoryMapper } from '../mappers/category.mapper';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { FindAllCategoriesDto } from '../../../../dto/find-all-categories.dto'; // Asegúrate que este DTO ya no tenga page/limit

@Injectable()
export class CategoriesRelationalRepository extends BaseRelationalRepository<
  CategoryEntity,
  Category,
  FindAllCategoriesDto
> {
  constructor(
    @InjectRepository(CategoryEntity)
    ormRepo: Repository<CategoryEntity>,
    mapper: CategoryMapper, 
  ) {
    super(ormRepo, mapper); 
  }

  // Sobrescribe buildWhere para manejar filtros específicos de categorías
  protected override buildWhere(
    filter?: FindAllCategoriesDto,
  ): FindOptionsWhere<CategoryEntity> | undefined {
    if (!filter) return undefined;

    const where: FindOptionsWhere<CategoryEntity> = {};

    if (filter.name) {
      where.name = ILike(`%${filter.name}%`);
    }
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    // Devuelve undefined si no hay filtros para evitar un objeto `where` vacío
    return Object.keys(where).length > 0 ? where : undefined;
  }

  // -------- Métodos adicionales específicos de este repositorio ----------
  async findFullMenu(): Promise<Category[]> {
    const queryBuilder = this.ormRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect(
        'category.subcategories',
        'subcategory',
        'subcategory.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'subcategory.products',
        'product',
        'product.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'product.variants',
        'productVariant',
        'productVariant.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'product.modifierGroups',
        'modifierGroup',
        'modifierGroup.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect(
        'modifierGroup.productModifiers',
        'modifier',
        'modifier.isActive = :isActive',
        { isActive: true },
      )
      .leftJoinAndSelect('category.photo', 'categoryPhoto')
      .leftJoinAndSelect('subcategory.photo', 'subcategoryPhoto')
      .leftJoinAndSelect('product.photo', 'productPhoto')
      .where('category.isActive = :isActive', { isActive: true })
      .orderBy({
        'category.name': 'ASC',
        'subcategory.name': 'ASC',
        'product.name': 'ASC',
      });

    const entities = await queryBuilder.getMany();

    const domainResults = entities
      .map((entity) => this.mapper.toDomain(entity))
      .filter((item): item is Category => item !== null);

    return domainResults;
  }
}

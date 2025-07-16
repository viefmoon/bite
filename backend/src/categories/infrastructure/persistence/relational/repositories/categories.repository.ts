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

  // Sobrescribir findById para incluir relación de foto
  async findById(id: string): Promise<Category | null> {
    const entity = await this.ormRepo.findOne({
      where: { id },
      relations: ['photo'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  // Sobrescribir findAll para incluir relación de foto
  async findAll(filter?: FindAllCategoriesDto): Promise<Category[]> {
    const where = this.buildWhere(filter);
    const entities = await this.ormRepo.find({
      where,
      relations: ['photo'],
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });
    return entities
      .map((e) => this.mapper.toDomain(e))
      .filter((d): d is Category => d !== null);
  }

  // -------- Métodos adicionales específicos de este repositorio ----------
  async findFullMenu(): Promise<Category[]> {
    const queryBuilder = this.ormRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.subcategories', 'subcategory')
      .leftJoinAndSelect('subcategory.products', 'product')
      .leftJoinAndSelect('product.variants', 'productVariant')
      .leftJoinAndSelect('product.modifierGroups', 'modifierGroup')
      .leftJoinAndSelect('modifierGroup.productModifiers', 'modifier')
      .leftJoinAndSelect('product.pizzaCustomizations', 'pizzaCustomization')
      .leftJoinAndSelect('product.pizzaConfiguration', 'pizzaConfiguration')
      .leftJoinAndSelect('category.photo', 'categoryPhoto')
      .leftJoinAndSelect('subcategory.photo', 'subcategoryPhoto')
      .leftJoinAndSelect('product.photo', 'productPhoto')
      .orderBy({
        'category.sortOrder': 'ASC',
        'category.name': 'ASC',
        'subcategory.sortOrder': 'ASC',
        'subcategory.name': 'ASC',
        'product.sortOrder': 'ASC',
        'product.name': 'ASC',
        'productVariant.sortOrder': 'ASC',
        'productVariant.name': 'ASC',
        'modifierGroup.sortOrder': 'ASC',
        'modifierGroup.name': 'ASC',
        'modifier.sortOrder': 'ASC',
        'modifier.name': 'ASC',
      });

    const entities = await queryBuilder.getMany();

    const domainResults = entities
      .map((entity) => this.mapper.toDomain(entity))
      .filter((item): item is Category => item !== null);

    return domainResults;
  }

  // Método para obtener el menú usado en la creación de órdenes
  async findOrderMenu(): Promise<Category[]> {
    const queryBuilder = this.ormRepo
      .createQueryBuilder('category')
      .select([
        // Categorías - solo campos necesarios
        'category.id',
        'category.name',
        'category.isActive',
        'category.sortOrder',
      ])
      // Subcategorías
      .leftJoin('category.subcategories', 'subcategory')
      .addSelect([
        'subcategory.id',
        'subcategory.name',
        'subcategory.isActive',
        'subcategory.sortOrder',
      ])
      // Productos
      .leftJoin('subcategory.products', 'product')
      .addSelect([
        'product.id',
        'product.name',
        'product.price',
        'product.description',
        'product.hasVariants',
        'product.isActive',
        'product.isPizza',
        'product.preparationScreenId',
        'product.sortOrder',
      ])
      // Variantes
      .leftJoin('product.variants', 'productVariant')
      .addSelect([
        'productVariant.id',
        'productVariant.name',
        'productVariant.price',
        'productVariant.isActive',
        'productVariant.sortOrder',
      ])
      // Grupos de modificadores
      .leftJoin('product.modifierGroups', 'modifierGroup')
      .addSelect([
        'modifierGroup.id',
        'modifierGroup.name',
        'modifierGroup.description',
        'modifierGroup.minSelections',
        'modifierGroup.maxSelections',
        'modifierGroup.isRequired',
        'modifierGroup.allowMultipleSelections',
        'modifierGroup.sortOrder',
      ])
      // Modificadores
      .leftJoin('modifierGroup.productModifiers', 'modifier')
      .addSelect([
        'modifier.id',
        'modifier.name',
        'modifier.price',
        'modifier.isDefault',
        'modifier.isActive',
        'modifier.sortOrder',
      ])
      // Pizza customizations (solo si es pizza)
      .leftJoinAndSelect('product.pizzaCustomizations', 'pizzaCustomization')
      // Pizza configuration (solo si es pizza)
      .leftJoinAndSelect('product.pizzaConfiguration', 'pizzaConfiguration')
      // Fotos - solo la ruta
      .leftJoin('category.photo', 'categoryPhoto')
      .addSelect(['categoryPhoto.path'])
      .leftJoin('subcategory.photo', 'subcategoryPhoto')
      .addSelect(['subcategoryPhoto.path'])
      .leftJoin('product.photo', 'productPhoto')
      .addSelect(['productPhoto.path'])
      // Ordenamiento
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .addOrderBy('subcategory.sortOrder', 'ASC')
      .addOrderBy('subcategory.name', 'ASC')
      .addOrderBy('product.sortOrder', 'ASC')
      .addOrderBy('product.name', 'ASC')
      .addOrderBy('productVariant.sortOrder', 'ASC')
      .addOrderBy('productVariant.name', 'ASC')
      .addOrderBy('modifierGroup.sortOrder', 'ASC')
      .addOrderBy('modifierGroup.name', 'ASC')
      .addOrderBy('modifier.sortOrder', 'ASC')
      .addOrderBy('modifier.name', 'ASC');

    const entities = await queryBuilder.getMany();

    const domainResults = entities
      .map((entity) => this.mapper.toDomain(entity))
      .filter((item): item is Category => item !== null);

    return domainResults;
  }
}

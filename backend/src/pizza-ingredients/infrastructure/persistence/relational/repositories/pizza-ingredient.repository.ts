import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PizzaIngredientEntity } from '../entities/pizza-ingredient.entity';
import { PizzaIngredientRepository } from '../../pizza-ingredient.repository';
import { PizzaIngredient } from '../../../../domain/pizza-ingredient';
import { PizzaIngredientMapper } from '../mappers/pizza-ingredient.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class PizzaIngredientRelationalRepository
  implements PizzaIngredientRepository
{
  constructor(
    @InjectRepository(PizzaIngredientEntity)
    private readonly pizzaIngredientRepository: Repository<PizzaIngredientEntity>,
  ) {}

  async create(
    data: Omit<PizzaIngredient, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<PizzaIngredient> {
    const persistenceModel = PizzaIngredientMapper.toPersistence(
      data as PizzaIngredient,
    );
    const newEntity = await this.pizzaIngredientRepository.save(
      this.pizzaIngredientRepository.create(persistenceModel),
    );
    return PizzaIngredientMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    paginationOptions,
    filterOptions,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions?: {
      productId?: string;
      search?: string;
      isActive?: boolean;
    } | null;
  }): Promise<PizzaIngredient[]> {
    const queryBuilder = this.pizzaIngredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.products', 'product');

    if (filterOptions?.productId) {
      queryBuilder.andWhere('product.id = :productId', {
        productId: filterOptions.productId,
      });
    }

    if (filterOptions?.search) {
      queryBuilder.andWhere('ingredient.name ILIKE :search', {
        search: `%${filterOptions.search}%`,
      });
    }

    if (filterOptions?.isActive !== undefined) {
      queryBuilder.andWhere('ingredient.isActive = :isActive', {
        isActive: filterOptions.isActive,
      });
    }

    const entities = await queryBuilder
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit)
      .orderBy('ingredient.sortOrder', 'ASC')
      .addOrderBy('ingredient.name', 'ASC')
      .getMany();

    return entities.map((entity) => PizzaIngredientMapper.toDomain(entity));
  }

  async findById(id: string): Promise<PizzaIngredient | null> {
    const entity = await this.pizzaIngredientRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    return entity ? PizzaIngredientMapper.toDomain(entity) : null;
  }

  async findByProductId(productId: string): Promise<PizzaIngredient[]> {
    const entities = await this.pizzaIngredientRepository
      .createQueryBuilder('ingredient')
      .leftJoinAndSelect('ingredient.products', 'product')
      .where('product.id = :productId', { productId })
      .andWhere('ingredient.isActive = :isActive', { isActive: true })
      .orderBy('ingredient.sortOrder', 'ASC')
      .addOrderBy('ingredient.name', 'ASC')
      .getMany();

    return entities.map((entity) => PizzaIngredientMapper.toDomain(entity));
  }

  async update(
    id: string,
    payload: Partial<PizzaIngredient>,
  ): Promise<PizzaIngredient | null> {
    await this.pizzaIngredientRepository.update(id, payload);

    const entity = await this.pizzaIngredientRepository.findOne({
      where: { id },
    });

    return entity ? PizzaIngredientMapper.toDomain(entity) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.pizzaIngredientRepository.softDelete(id);
  }
}

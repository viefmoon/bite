import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
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
    const where: FindOptionsWhere<PizzaIngredientEntity> = {};

    if (filterOptions?.productId) {
      where.productId = filterOptions.productId;
    }

    if (filterOptions?.search) {
      where.name = ILike(`%${filterOptions.search}%`);
    }

    if (filterOptions?.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    const entities = await this.pizzaIngredientRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    return entities.map((entity) => PizzaIngredientMapper.toDomain(entity));
  }

  async findById(id: string): Promise<PizzaIngredient | null> {
    const entity = await this.pizzaIngredientRepository.findOne({
      where: { id },
    });

    return entity ? PizzaIngredientMapper.toDomain(entity) : null;
  }

  async findByProductId(productId: string): Promise<PizzaIngredient[]> {
    const entities = await this.pizzaIngredientRepository.find({
      where: { productId, isActive: true },
      order: { name: 'ASC' },
    });

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

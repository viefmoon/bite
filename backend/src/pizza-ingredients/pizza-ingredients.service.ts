import { Injectable, NotFoundException } from '@nestjs/common';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { PizzaIngredient } from './domain/pizza-ingredient';
import { CreatePizzaIngredientDto } from './dto/create-pizza-ingredient.dto';
import { UpdatePizzaIngredientDto } from './dto/update-pizza-ingredient.dto';
import { FindAllPizzaIngredientsDto } from './dto/find-all-pizza-ingredients.dto';
import { PizzaIngredientRepository } from './infrastructure/persistence/pizza-ingredient.repository';

@Injectable()
export class PizzaIngredientsService {
  constructor(
    private readonly pizzaIngredientRepository: PizzaIngredientRepository,
  ) {}

  async create(
    createPizzaIngredientDto: CreatePizzaIngredientDto,
  ): Promise<PizzaIngredient> {
    const clonedPayload = {
      ...createPizzaIngredientDto,
      ingredientValue: createPizzaIngredientDto.ingredientValue ?? 1,
      isActive: createPizzaIngredientDto.isActive ?? true,
    };

    return this.pizzaIngredientRepository.create(clonedPayload);
  }

  async findAllWithPagination({
    paginationOptions,
    filterOptions,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions?: FindAllPizzaIngredientsDto;
  }): Promise<PizzaIngredient[]> {
    return this.pizzaIngredientRepository.findManyWithPagination({
      paginationOptions,
      filterOptions: {
        productId: filterOptions?.productId,
        search: filterOptions?.search,
        isActive: filterOptions?.isActive,
      },
    });
  }

  async findOne(id: string): Promise<PizzaIngredient> {
    const pizzaIngredient = await this.pizzaIngredientRepository.findById(id);

    if (!pizzaIngredient) {
      throw new NotFoundException(`Pizza ingredient #${id} not found`);
    }

    return pizzaIngredient;
  }

  async findByProductId(productId: string): Promise<PizzaIngredient[]> {
    return this.pizzaIngredientRepository.findByProductId(productId);
  }

  async update(
    id: string,
    updatePizzaIngredientDto: UpdatePizzaIngredientDto,
  ): Promise<PizzaIngredient> {
    const pizzaIngredient = await this.pizzaIngredientRepository.update(
      id,
      updatePizzaIngredientDto,
    );

    if (!pizzaIngredient) {
      throw new NotFoundException(`Pizza ingredient #${id} not found`);
    }

    return pizzaIngredient;
  }

  async remove(id: string): Promise<void> {
    const pizzaIngredient = await this.findOne(id);
    await this.pizzaIngredientRepository.softDelete(pizzaIngredient.id);
  }
}

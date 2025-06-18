import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { PizzaIngredient } from './domain/pizza-ingredient';
import { CreatePizzaIngredientDto } from './dto/create-pizza-ingredient.dto';
import { UpdatePizzaIngredientDto } from './dto/update-pizza-ingredient.dto';
import { FindAllPizzaIngredientsDto } from './dto/find-all-pizza-ingredients.dto';
import { PizzaIngredientRepository } from './infrastructure/persistence/pizza-ingredient.repository';
import { PIZZA_INGREDIENT_REPOSITORY } from '../common/tokens';
import {
  CustomIdService,
  EntityPrefix,
} from '../common/services/custom-id.service';

@Injectable()
export class PizzaIngredientsService {
  constructor(
    @Inject(PIZZA_INGREDIENT_REPOSITORY)
    private readonly pizzaIngredientRepository: PizzaIngredientRepository,
    private readonly customIdService: CustomIdService,
  ) {}

  async create(
    createPizzaIngredientDto: CreatePizzaIngredientDto,
  ): Promise<PizzaIngredient> {
    const clonedPayload = {
      ...createPizzaIngredientDto,
      id: await this.customIdService.generateId(
        EntityPrefix.PIZZA_INGREDIENT,
        'pizza_ingredient',
      ),
      ingredientValue: createPizzaIngredientDto.ingredientValue ?? 1,
      isActive: createPizzaIngredientDto.isActive ?? true,
      sortOrder: createPizzaIngredientDto.sortOrder ?? 0,
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

  async assignToProducts(pizzaIngredientId: string): Promise<PizzaIngredient> {
    // Este método se implementará cuando se necesite asignar ingredientes a productos
    // Por ahora, la asignación se maneja desde el lado del producto
    // El parámetro productIds se agregará cuando se implemente la funcionalidad
    return this.findOne(pizzaIngredientId);
  }
}

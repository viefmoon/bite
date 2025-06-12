import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { PizzaIngredient } from '../../domain/pizza-ingredient';

export abstract class PizzaIngredientRepository {
  abstract create(
    data: Omit<PizzaIngredient, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
  ): Promise<PizzaIngredient>;

  abstract findManyWithPagination({
    paginationOptions,
    filterOptions,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions?: {
      productId?: string;
      search?: string;
      isActive?: boolean;
    } | null;
  }): Promise<PizzaIngredient[]>;

  abstract findById(id: string): Promise<PizzaIngredient | null>;

  abstract findByProductId(productId: string): Promise<PizzaIngredient[]>;

  abstract update(
    id: string,
    payload: DeepPartial<PizzaIngredient>,
  ): Promise<PizzaIngredient | null>;

  abstract softDelete(id: string): Promise<void>;
}

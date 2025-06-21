import { PizzaCustomization } from '../../domain/pizza-customization';
import { Paginated } from '../../../common/types/paginated.type';

export abstract class PizzaCustomizationRepository {
  abstract create(
    pizzaCustomization: PizzaCustomization,
  ): Promise<PizzaCustomization>;

  abstract findAll(options: {
    page: number;
    limit: number;
    isActive?: boolean;
    type?: string;
  }): Promise<Paginated<PizzaCustomization>>;

  abstract findById(id: string): Promise<PizzaCustomization | null>;

  abstract findByIds(ids: string[]): Promise<PizzaCustomization[]>;

  abstract update(
    id: string,
    pizzaCustomization: Partial<PizzaCustomization>,
  ): Promise<PizzaCustomization | null>;

  abstract softDelete(id: string): Promise<void>;
}
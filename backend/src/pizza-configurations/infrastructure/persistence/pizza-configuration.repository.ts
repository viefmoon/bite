import { PizzaConfiguration } from '../../domain/pizza-configuration';

export abstract class PizzaConfigurationRepository {
  abstract create(
    pizzaConfiguration: PizzaConfiguration,
  ): Promise<PizzaConfiguration>;

  abstract findById(id: string): Promise<PizzaConfiguration | null>;

  abstract findByProductId(
    productId: string,
  ): Promise<PizzaConfiguration | null>;

  abstract update(
    id: string,
    pizzaConfiguration: Partial<PizzaConfiguration>,
  ): Promise<PizzaConfiguration>;

  abstract updateByProductId(
    productId: string,
    pizzaConfiguration: Partial<PizzaConfiguration>,
  ): Promise<PizzaConfiguration | null>;

  abstract delete(id: string): Promise<void>;

  abstract deleteByProductId(productId: string): Promise<void>;
}

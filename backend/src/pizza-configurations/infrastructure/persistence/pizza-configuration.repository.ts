import { PizzaConfiguration } from '../../domain/pizza-configuration';

export abstract class PizzaConfigurationRepository {
  abstract create(
    pizzaConfiguration: PizzaConfiguration,
  ): Promise<PizzaConfiguration>;

  abstract findByProductId(
    productId: string,
  ): Promise<PizzaConfiguration | null>;

  abstract updateByProductId(
    productId: string,
    pizzaConfiguration: Partial<PizzaConfiguration>,
  ): Promise<PizzaConfiguration | null>;

  abstract deleteByProductId(productId: string): Promise<void>;
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PizzaConfiguration } from './domain/pizza-configuration';
import { PizzaConfigurationRepository } from './infrastructure/persistence/pizza-configuration.repository';
import { CreatePizzaConfigurationDto } from './dto/create-pizza-configuration.dto';
import { UpdatePizzaConfigurationDto } from './dto/update-pizza-configuration.dto';

@Injectable()
export class PizzaConfigurationsService {
  constructor(
    private readonly pizzaConfigurationRepository: PizzaConfigurationRepository,
  ) {}

  async create(
    createPizzaConfigurationDto: CreatePizzaConfigurationDto,
  ): Promise<PizzaConfiguration> {
    // Check if configuration already exists for this product
    const existing = await this.pizzaConfigurationRepository.findByProductId(
      createPizzaConfigurationDto.productId,
    );
    if (existing) {
      throw new Error(
        `Pizza configuration already exists for product ${createPizzaConfigurationDto.productId}`,
      );
    }

    const pizzaConfiguration = new PizzaConfiguration();
    pizzaConfiguration.productId = createPizzaConfigurationDto.productId;
    pizzaConfiguration.includedToppings = createPizzaConfigurationDto.includedToppings;
    pizzaConfiguration.extraToppingCost = createPizzaConfigurationDto.extraToppingCost;

    return this.pizzaConfigurationRepository.create(pizzaConfiguration);
  }

  async findByProductId(productId: string): Promise<PizzaConfiguration> {
    const pizzaConfiguration =
      await this.pizzaConfigurationRepository.findByProductId(productId);
    if (!pizzaConfiguration) {
      throw new NotFoundException(
        `Pizza configuration for product ${productId} not found`,
      );
    }
    return pizzaConfiguration;
  }

  async update(
    productId: string,
    updatePizzaConfigurationDto: UpdatePizzaConfigurationDto,
  ): Promise<PizzaConfiguration> {
    const updated = await this.pizzaConfigurationRepository.updateByProductId(
      productId,
      updatePizzaConfigurationDto,
    );
    if (!updated) {
      throw new NotFoundException(
        `Pizza configuration for product ${productId} not found`,
      );
    }
    return updated;
  }

  async remove(productId: string): Promise<void> {
    await this.pizzaConfigurationRepository.deleteByProductId(productId);
  }
}
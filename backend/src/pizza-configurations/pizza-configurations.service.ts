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
    pizzaConfiguration.includedToppings =
      createPizzaConfigurationDto.includedToppings;
    pizzaConfiguration.extraToppingCost =
      createPizzaConfigurationDto.extraToppingCost;

    return this.pizzaConfigurationRepository.create(pizzaConfiguration);
  }

  async findByProductId(productId: string): Promise<PizzaConfiguration | null> {
    const pizzaConfiguration =
      await this.pizzaConfigurationRepository.findByProductId(productId);
    return pizzaConfiguration;
  }

  async update(
    id: string,
    updatePizzaConfigurationDto: UpdatePizzaConfigurationDto,
  ): Promise<PizzaConfiguration> {
    const configuration = await this.pizzaConfigurationRepository.findById(id);
    if (!configuration) {
      throw new NotFoundException(
        `Pizza configuration with id ${id} not found`,
      );
    }

    Object.assign(configuration, updatePizzaConfigurationDto);
    return this.pizzaConfigurationRepository.update(id, configuration);
  }

  async remove(id: string): Promise<void> {
    const configuration = await this.pizzaConfigurationRepository.findById(id);
    if (!configuration) {
      throw new NotFoundException(
        `Pizza configuration with id ${id} not found`,
      );
    }
    await this.pizzaConfigurationRepository.delete(id);
  }
}

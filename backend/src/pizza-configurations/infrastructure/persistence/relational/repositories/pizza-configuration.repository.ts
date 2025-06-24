import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PizzaConfigurationEntity } from '../entities/pizza-configuration.entity';
import { PizzaConfigurationMapper } from '../mappers/pizza-configuration.mapper';
import { PizzaConfiguration } from '../../../../domain/pizza-configuration';
import { PizzaConfigurationRepository } from '../../pizza-configuration.repository';

@Injectable()
export class PizzaConfigurationRelationalRepository
  implements PizzaConfigurationRepository
{
  constructor(
    @InjectRepository(PizzaConfigurationEntity)
    private readonly pizzaConfigurationRepository: Repository<PizzaConfigurationEntity>,
    private readonly pizzaConfigurationMapper: PizzaConfigurationMapper,
  ) {}

  async create(
    pizzaConfiguration: PizzaConfiguration,
  ): Promise<PizzaConfiguration> {
    const persistenceModel =
      this.pizzaConfigurationMapper.toEntity(pizzaConfiguration);
    if (!persistenceModel) {
      throw new Error('Failed to map pizza configuration to entity');
    }

    const newEntity = await this.pizzaConfigurationRepository.save(
      this.pizzaConfigurationRepository.create(persistenceModel),
    );

    const domainResult = this.pizzaConfigurationMapper.toDomain(newEntity);
    if (!domainResult) {
      throw new Error('Failed to map entity to domain');
    }

    return domainResult;
  }

  async findByProductId(productId: string): Promise<PizzaConfiguration | null> {
    const entity = await this.pizzaConfigurationRepository.findOne({
      where: { productId },
    });

    if (!entity) {
      return null;
    }

    return this.pizzaConfigurationMapper.toDomain(entity);
  }

  async updateByProductId(
    productId: string,
    pizzaConfiguration: Partial<PizzaConfiguration>,
  ): Promise<PizzaConfiguration | null> {
    const result = await this.pizzaConfigurationRepository.update(
      { productId },
      pizzaConfiguration,
    );

    if (result.affected === 0) {
      return null;
    }

    return this.findByProductId(productId);
  }

  async deleteByProductId(productId: string): Promise<void> {
    const result = await this.pizzaConfigurationRepository.delete({
      productId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Pizza configuration for product ${productId} not found`,
      );
    }
  }
}

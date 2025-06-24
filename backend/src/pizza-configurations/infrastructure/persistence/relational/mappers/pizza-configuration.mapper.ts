import { Injectable } from '@nestjs/common';
import { PizzaConfiguration } from '../../../../domain/pizza-configuration';
import { PizzaConfigurationEntity } from '../entities/pizza-configuration.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class PizzaConfigurationMapper extends BaseMapper<
  PizzaConfigurationEntity,
  PizzaConfiguration
> {
  override toDomain(
    entity: PizzaConfigurationEntity,
  ): PizzaConfiguration | null {
    if (!entity) return null;
    const domain = new PizzaConfiguration();
    domain.id = entity.id;
    domain.productId = entity.productId;
    domain.includedToppings = entity.includedToppings;
    domain.extraToppingCost = entity.extraToppingCost;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(
    domain: PizzaConfiguration,
  ): PizzaConfigurationEntity | null {
    if (!domain) return null;
    const entity = new PizzaConfigurationEntity();
    if (domain.id) entity.id = domain.id;
    entity.productId = domain.productId;
    entity.includedToppings = domain.includedToppings;
    entity.extraToppingCost = domain.extraToppingCost;
    return entity;
  }
}

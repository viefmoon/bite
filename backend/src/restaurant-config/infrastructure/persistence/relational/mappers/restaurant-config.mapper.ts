import { RestaurantConfig } from '../../../../domain/restaurant-config';
import { RestaurantConfigEntity } from '../entities/restaurant-config.entity';

export class RestaurantConfigMapper {
  static toDomain(raw: RestaurantConfigEntity): RestaurantConfig {
    const domainEntity = new RestaurantConfig();
    domainEntity.id = raw.id;
    domainEntity.acceptingOrders = raw.acceptingOrders;
    domainEntity.estimatedPickupTime = raw.estimatedPickupTime;
    domainEntity.estimatedDeliveryTime = raw.estimatedDeliveryTime;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: RestaurantConfig): RestaurantConfigEntity {
    const persistenceEntity = new RestaurantConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.acceptingOrders = domainEntity.acceptingOrders;
    persistenceEntity.estimatedPickupTime = domainEntity.estimatedPickupTime;
    persistenceEntity.estimatedDeliveryTime =
      domainEntity.estimatedDeliveryTime;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}

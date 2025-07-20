import { Injectable } from '@nestjs/common';
import { RestaurantConfig } from '../../../../domain/restaurant-config';
import { RestaurantConfigEntity } from '../entities/restaurant-config.entity';
import { BusinessHoursMapper } from './business-hours.mapper';
import { mapArray } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class RestaurantConfigMapper {
  constructor(private readonly businessHoursMapper: BusinessHoursMapper) {}

  toDomain(raw: RestaurantConfigEntity): RestaurantConfig {
    const domainEntity = new RestaurantConfig();
    domainEntity.id = raw.id;

    // Información básica
    domainEntity.restaurantName = raw.restaurantName;
    domainEntity.phoneMain = raw.phoneMain;
    domainEntity.phoneSecondary = raw.phoneSecondary;
    domainEntity.address = raw.address;
    domainEntity.city = raw.city;
    domainEntity.state = raw.state;
    domainEntity.postalCode = raw.postalCode;
    domainEntity.country = raw.country;

    // Configuración de operación
    domainEntity.acceptingOrders = raw.acceptingOrders;
    domainEntity.estimatedPickupTime = raw.estimatedPickupTime;
    domainEntity.estimatedDeliveryTime = raw.estimatedDeliveryTime;
    domainEntity.estimatedDineInTime = raw.estimatedDineInTime;
    domainEntity.openingGracePeriod = raw.openingGracePeriod;
    domainEntity.closingGracePeriod = raw.closingGracePeriod;
    domainEntity.timeZone = raw.timeZone;
    domainEntity.scheduledOrdersLeadTime = raw.scheduledOrdersLeadTime;

    // Configuración de delivery
    domainEntity.deliveryCoverageArea = raw.deliveryCoverageArea;
    domainEntity.minimumOrderValueForDelivery = raw.minimumOrderValueForDelivery;

    // Relaciones
    domainEntity.businessHours = mapArray(raw.businessHours, (hours) =>
      this.businessHoursMapper.toDomain(hours),
    );

    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  toPersistence(domainEntity: RestaurantConfig): RestaurantConfigEntity {
    const persistenceEntity = new RestaurantConfigEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }

    // Información básica
    persistenceEntity.restaurantName = domainEntity.restaurantName;
    persistenceEntity.phoneMain = domainEntity.phoneMain;
    persistenceEntity.phoneSecondary = domainEntity.phoneSecondary;
    persistenceEntity.address = domainEntity.address;
    persistenceEntity.city = domainEntity.city;
    persistenceEntity.state = domainEntity.state;
    persistenceEntity.postalCode = domainEntity.postalCode;
    persistenceEntity.country = domainEntity.country;

    // Configuración de operación
    persistenceEntity.acceptingOrders = domainEntity.acceptingOrders;
    persistenceEntity.estimatedPickupTime = domainEntity.estimatedPickupTime;
    persistenceEntity.estimatedDeliveryTime =
      domainEntity.estimatedDeliveryTime;
    persistenceEntity.estimatedDineInTime = domainEntity.estimatedDineInTime;
    persistenceEntity.openingGracePeriod = domainEntity.openingGracePeriod;
    persistenceEntity.closingGracePeriod = domainEntity.closingGracePeriod;
    persistenceEntity.timeZone = domainEntity.timeZone;
    persistenceEntity.scheduledOrdersLeadTime =
      domainEntity.scheduledOrdersLeadTime;

    // Configuración de delivery
    persistenceEntity.deliveryCoverageArea = domainEntity.deliveryCoverageArea;
    persistenceEntity.minimumOrderValueForDelivery = domainEntity.minimumOrderValueForDelivery;

    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}

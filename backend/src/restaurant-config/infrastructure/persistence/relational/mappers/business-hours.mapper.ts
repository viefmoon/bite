import { Injectable } from '@nestjs/common';
import { BusinessHours } from '../../../../domain/business-hours';
import { BusinessHoursEntity } from '../entities/business-hours.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { RestaurantConfigEntity } from '../entities/restaurant-config.entity';

@Injectable()
export class BusinessHoursMapper extends BaseMapper<
  BusinessHoursEntity,
  BusinessHours
> {
  override toDomain(entity: BusinessHoursEntity): BusinessHours | null {
    if (!entity) {
      return null;
    }
    const domain = new BusinessHours();
    domain.id = entity.id;
    domain.dayOfWeek = entity.dayOfWeek;
    domain.openingTime = entity.openingTime;
    domain.closingTime = entity.closingTime;
    domain.isClosed = entity.isClosed;
    domain.restaurantConfigId = entity.restaurantConfigId;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    return domain;
  }

  override toEntity(domain: BusinessHours): BusinessHoursEntity | null {
    if (!domain) {
      return null;
    }
    const entity = new BusinessHoursEntity();
    if (domain.id) entity.id = domain.id;
    entity.dayOfWeek = domain.dayOfWeek;
    entity.openingTime = domain.openingTime;
    entity.closingTime = domain.closingTime;
    entity.isClosed = domain.isClosed;
    entity.restaurantConfig = {
      id: domain.restaurantConfigId,
    } as RestaurantConfigEntity;

    return entity;
  }
}

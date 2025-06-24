import { Injectable } from '@nestjs/common';
import { DeliveryInfo } from '../../../../domain/delivery-info';
import { DeliveryInfoEntity } from '../entities/delivery-info.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class DeliveryInfoMapper extends BaseMapper<
  DeliveryInfoEntity,
  DeliveryInfo
> {
  override toDomain(entity: DeliveryInfoEntity): DeliveryInfo | null {
    if (!entity) return null;
    const domain = new DeliveryInfo();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.fullAddress = entity.fullAddress;
    domain.street = entity.street;
    domain.number = entity.number;
    domain.interiorNumber = entity.interiorNumber;
    domain.neighborhood = entity.neighborhood;
    domain.city = entity.city;
    domain.state = entity.state;
    domain.zipCode = entity.zipCode;
    domain.country = entity.country;
    domain.recipientName = entity.recipientName;
    domain.recipientPhone = entity.recipientPhone;
    domain.deliveryInstructions = entity.deliveryInstructions;
    domain.latitude = entity.latitude;
    domain.longitude = entity.longitude;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  override toEntity(domain: DeliveryInfo): DeliveryInfoEntity | null {
    if (!domain) return null;
    const entity = new DeliveryInfoEntity();
    if (domain.id) entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.fullAddress = domain.fullAddress;
    entity.street = domain.street;
    entity.number = domain.number;
    entity.interiorNumber = domain.interiorNumber;
    entity.neighborhood = domain.neighborhood;
    entity.city = domain.city;
    entity.state = domain.state;
    entity.zipCode = domain.zipCode;
    entity.country = domain.country;
    entity.recipientName = domain.recipientName;
    entity.recipientPhone = domain.recipientPhone;
    entity.deliveryInstructions = domain.deliveryInstructions;
    entity.latitude = domain.latitude;
    entity.longitude = domain.longitude;
    return entity;
  }
}

import { Injectable } from '@nestjs/common';
import { Address } from '../../../../domain/address';
import { AddressEntity } from '../entities/address.entity';
import { CustomerEntity } from '../entities/customer.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class AddressMapper extends BaseMapper<AddressEntity, Address> {
  override toDomain(entity: AddressEntity): Address | null {
    if (!entity) {
      return null;
    }
    const domain = new Address();
    domain.id = entity.id;
    domain.customerId = entity.customerId;
    domain.street = entity.street;
    domain.number = entity.number;
    domain.interiorNumber = entity.interiorNumber ?? undefined;
    domain.neighborhood = entity.neighborhood ?? undefined;
    domain.city = entity.city ?? undefined;
    domain.state = entity.state ?? undefined;
    domain.zipCode = entity.zipCode ?? undefined;
    domain.country = entity.country ?? undefined;
    domain.references = entity.references ?? undefined;
    domain.latitude = entity.latitude ?? undefined;
    domain.longitude = entity.longitude ?? undefined;
    domain.isDefault = entity.isDefault;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    return domain;
  }

  override toEntity(domain: Address): AddressEntity | null {
    if (!domain) {
      return null;
    }
    const entity = new AddressEntity();
    entity.id = domain.id;
    entity.customer = { id: domain.customerId } as CustomerEntity;
    entity.street = domain.street;
    entity.number = domain.number;
    entity.interiorNumber = domain.interiorNumber ?? null;
    entity.neighborhood = domain.neighborhood ?? null;
    entity.city = domain.city ?? null;
    entity.state = domain.state ?? null;
    entity.zipCode = domain.zipCode ?? null;
    entity.country = domain.country ?? null;
    entity.references = domain.references ?? null;
    entity.latitude = domain.latitude ?? null;
    entity.longitude = domain.longitude ?? null;
    entity.isDefault = domain.isDefault;
    return entity;
  }
}

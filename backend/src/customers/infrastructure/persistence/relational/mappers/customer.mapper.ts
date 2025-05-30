import { Injectable } from '@nestjs/common';
import { Customer } from '../../../../domain/customer';
import { CustomerEntity } from '../entities/customer.entity';
import { AddressMapper } from './address.mapper';
import { BaseMapper, mapArray } from '../../../../../common/mappers/base.mapper';
// Address import removed as it was unused

@Injectable()
export class CustomerMapper extends BaseMapper<CustomerEntity, Customer> {
  constructor(private readonly addressMapper: AddressMapper) {
    super();
  }

  override toDomain(entity: CustomerEntity): Customer | null {
    if (!entity) {
      return null;
    }
    const domain = new Customer();
    domain.id = entity.id;
    domain.firstName = entity.firstName;
    domain.lastName = entity.lastName;
    domain.phoneNumber = entity.phoneNumber;
    domain.email = entity.email;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.addresses = mapArray(entity.addresses, (addressEntity) =>
      this.addressMapper.toDomain(addressEntity),
    );

    return domain;
  }

  override toEntity(domain: Customer): CustomerEntity | null {
    if (!domain) {
      return null;
    }
    const entity = new CustomerEntity();
    entity.id = domain.id;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.phoneNumber = domain.phoneNumber ?? null;
    entity.email = domain.email ?? null;

    return entity;
  }
}

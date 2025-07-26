import { Injectable } from '@nestjs/common';
import { Customer } from '../../../../domain/customer';
import { CustomerEntity } from '../entities/customer.entity';
import { AddressMapper } from './address.mapper';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';

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
    domain.whatsappPhoneNumber = entity.whatsappPhoneNumber;
    domain.stripeCustomerId = entity.stripeCustomerId;
    domain.email = entity.email;
    domain.birthDate = entity.birthDate;
    domain.fullChatHistory = entity.fullChatHistory;
    domain.relevantChatHistory = entity.relevantChatHistory;
    domain.lastInteraction = entity.lastInteraction;
    domain.totalOrders = entity.totalOrders;
    domain.totalSpent = entity.totalSpent;
    domain.isActive = entity.isActive;
    domain.isBanned = entity.isBanned;
    domain.bannedAt = entity.bannedAt;
    domain.banReason = entity.banReason;
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
    entity.firstName = domain.firstName ?? null;
    entity.lastName = domain.lastName ?? null;
    entity.whatsappPhoneNumber = domain.whatsappPhoneNumber;
    entity.stripeCustomerId = domain.stripeCustomerId ?? null;
    entity.email = domain.email ?? null;
    entity.birthDate = domain.birthDate ?? null;
    entity.fullChatHistory = domain.fullChatHistory ?? null;
    entity.relevantChatHistory = domain.relevantChatHistory ?? null;
    entity.lastInteraction = domain.lastInteraction ?? null;
    entity.totalOrders = domain.totalOrders ?? 0;
    entity.totalSpent = domain.totalSpent ?? 0;
    entity.isActive = domain.isActive ?? true;
    entity.isBanned = domain.isBanned ?? false;
    entity.bannedAt = domain.bannedAt ?? null;
    entity.banReason = domain.banReason ?? null;

    return entity;
  }
}

import { Injectable } from '@nestjs/common';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class UserMapper extends BaseMapper<UserEntity, User> {
  override toDomain(entity: UserEntity): User | null {
    if (!entity) return null;
    const domain = new User();
    domain.id = entity.id;
    domain.email = entity.email;
    domain.username = entity.username;
    domain.password = entity.password;
    domain.firstName = entity.firstName;
    domain.lastName = entity.lastName;
    domain.role = {
      id: entity.role.id,
      name: entity.role.name ?? null,
    };
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.birthDate = entity.birthDate;
    domain.gender = entity.gender;
    domain.phoneNumber = entity.phoneNumber;
    domain.address = entity.address;
    domain.city = entity.city;
    domain.state = entity.state;
    domain.country = entity.country;
    domain.zipCode = entity.zipCode;
    domain.emergencyContact = entity.emergencyContact;
    return domain;
  }

  override toEntity(domain: User): UserEntity | null {
    if (!domain) return null;
    if (!domain.role) {
      throw new Error('User domain entity must have a role to be mapped to persistence.');
    }

    const role = new RoleEntity();
    role.id = Number(domain.role.id);

    const entity = new UserEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.email = domain.email;
    entity.username = domain.username;
    entity.password = domain.password;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    entity.role = role;
    entity.isActive = domain.isActive;
    entity.birthDate = domain.birthDate;
    entity.gender = domain.gender;
    entity.phoneNumber = domain.phoneNumber;
    entity.address = domain.address;
    entity.city = domain.city;
    entity.state = domain.state;
    entity.country = domain.country;
    entity.zipCode = domain.zipCode;
    entity.emergencyContact = domain.emergencyContact;
    return entity;
  }
}

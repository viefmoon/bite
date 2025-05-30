import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository, In } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly userMapper: UserMapper,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = this.userMapper.toEntity(data);
    if (!persistenceModel) {
      throw new Error('Failed to map user domain to entity');
    }

    const newEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );
    const domainResult = this.userMapper.toDomain(newEntity);
    if (!domainResult) {
      throw new Error('Failed to map new user entity to domain');
    }
    return domainResult;
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: FindOptionsWhere<UserEntity> = {};
    if (filterOptions?.roles?.length) {
      where.role = filterOptions.roles.map((role) => ({
        id: Number(role.id),
      }));
    }

    const entities = await this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });

    return entities
      .map((user) => this.userMapper.toDomain(user))
      .filter((user): user is User => user !== null);
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findOne({
      where: { id: id },
    });

    return entity ? this.userMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    return entities
      .map((user) => this.userMapper.toDomain(user))
      .filter((user): user is User => user !== null);
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    const entity = await this.usersRepository.findOne({
      where: { email },
    });

    return entity ? this.userMapper.toDomain(entity) : null;
  }

  async findByUsername(
    username: User['username'],
  ): Promise<NullableType<User>> {
    if (!username) return null;

    const entity = await this.usersRepository.findOne({
      where: { username },
    });

    return entity ? this.userMapper.toDomain(entity) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User> {
    const entity = await this.usersRepository.findOne({
      where: { id: id },
    });

    if (!entity) {
      throw new Error('User not found');
    }

    const existingDomain = this.userMapper.toDomain(entity);
    if (!existingDomain) {
      throw new Error('Failed to map existing user entity to domain');
    }

    const persistenceModel = this.userMapper.toEntity({
      ...existingDomain,
      ...payload,
    });

    if (!persistenceModel) {
      throw new Error('Failed to map updated user domain to entity');
    }

    const updatedEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );

    const domainResult = this.userMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new Error('Failed to map updated user entity to domain');
    }
    return domainResult;
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}

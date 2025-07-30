import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository, MoreThanOrEqual } from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerRepository } from '../../customer.repository';
import { Customer } from '../../../../domain/customer';
import { CustomerMapper } from '../mappers/customer.mapper';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FindAllCustomersDto } from '../../../../dto/find-all-customers.dto';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { CreateCustomerDto } from '../../../../dto/create-customer.dto';
import { UpdateCustomerDto } from '../../../../dto/update-customer.dto';

@Injectable()
export class CustomerRelationalRepository
  extends BaseRelationalRepository<
    CustomerEntity,
    Customer,
    FindAllCustomersDto,
    CreateCustomerDto,
    UpdateCustomerDto
  >
  implements CustomerRepository
{
  constructor(
    @InjectRepository(CustomerEntity)
    ormRepo: Repository<CustomerEntity>,
    mapper: CustomerMapper,
  ) {
    super(ormRepo, mapper);
  }

  protected override buildWhere(
    filter?: FindAllCustomersDto,
  ): FindOptionsWhere<CustomerEntity> | undefined {
    const where: FindOptionsWhere<CustomerEntity> = {};

    if (filter?.firstName) {
      where.firstName = ILike(`%${filter.firstName}%`);
    }
    if (filter?.lastName) {
      where.lastName = ILike(`%${filter.lastName}%`);
    }
    if (filter?.email) {
      where.email = filter.email;
    }
    if (filter?.whatsappPhoneNumber) {
      where.whatsappPhoneNumber = filter.whatsappPhoneNumber;
    }
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter?.lastInteractionAfter) {
      where.lastInteraction = MoreThanOrEqual(filter.lastInteractionAfter);
    }
    if (filter?.isBanned !== undefined) {
      where.isBanned = filter.isBanned;
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }

  async findByEmail(email: Customer['email']): Promise<NullableType<Customer>> {
    if (!email) return null;
    const entity = await this.ormRepo.findOne({
      where: { email },
      relations: ['addresses'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByPhone(
    phone: Customer['whatsappPhoneNumber'],
  ): Promise<NullableType<Customer>> {
    if (!phone) return null;
    const entity = await this.ormRepo.findOne({
      where: { whatsappPhoneNumber: phone },
      relations: ['addresses'],
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  override async findAll(filter?: FindAllCustomersDto): Promise<Customer[]> {
    const where = this.buildWhere(filter);
    const entities = await this.ormRepo.find({
      where,
      relations: ['addresses'],
    });

    return entities
      .map((e) => this.mapper.toDomain(e))
      .filter((d): d is Customer => d !== null);
  }

  override async findById(id: Customer['id']): Promise<NullableType<Customer>> {
    const found = await this.ormRepo.findOne({
      where: { id } as FindOptionsWhere<CustomerEntity>,
      relations: ['addresses'],
    });
    return found ? this.mapper.toDomain(found) : null;
  }

  async findBannedCustomers(): Promise<Customer[]> {
    const entities = await this.ormRepo
      .createQueryBuilder('customer')
      .where('customer.isBanned = :isBanned', { isBanned: true })
      .orderBy('customer.bannedAt', 'DESC')
      .getMany();

    return entities
      .map((entity) => this.mapper.toDomain(entity))
      .filter(Boolean) as Customer[];
  }
}

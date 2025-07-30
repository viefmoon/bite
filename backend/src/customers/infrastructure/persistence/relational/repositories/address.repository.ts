import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { AddressEntity } from '../entities/address.entity';
import { AddressRepository } from '../../address.repository';
import { Address } from '../../../../domain/address';
import { AddressMapper } from '../mappers/address.mapper';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { CreateAddressDto } from '../../../../dto/create-address.dto';
import { UpdateAddressDto } from '../../../../dto/update-address.dto';
import { FindAllAddressesDto } from '../../../../dto/find-all-addresses.dto';

@Injectable()
export class AddressRelationalRepository
  extends BaseRelationalRepository<
    AddressEntity,
    Address,
    FindAllAddressesDto,
    CreateAddressDto,
    UpdateAddressDto
  >
  implements AddressRepository
{
  constructor(
    @InjectRepository(AddressEntity)
    ormRepo: Repository<AddressEntity>,
    mapper: AddressMapper,
  ) {
    super(ormRepo, mapper);
  }

  protected override buildWhere(
    filter?: FindAllAddressesDto,
  ): FindOptionsWhere<AddressEntity> | undefined {
    const where: FindOptionsWhere<AddressEntity> = {};

    if (filter?.customerId) {
      where.customer = { id: filter.customerId } as any;
    }
    if (filter?.isDefault !== undefined) {
      where.isDefault = filter.isDefault;
    }
    if (filter?.zipCode) {
      where.zipCode = filter.zipCode;
    }
    if (filter?.city) {
      where.city = ILike(`%${filter.city}%`);
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }

  override async update(
    id: Address['id'],
    payload: UpdateAddressDto,
  ): Promise<Address | null> {
    const existing = await this.ormRepo.findOne({
      where: { id } as FindOptionsWhere<AddressEntity>,
      relations: ['customer'],
    });

    if (!existing) {
      return null;
    }

    const updateData = Object.keys(payload).reduce((acc, key) => {
      const value = payload[key];
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    updateData.customer = existing.customer;

    const merged = this.ormRepo.merge(existing, updateData);
    const saved = await this.ormRepo.save(merged);

    return this.mapper.toDomain(saved);
  }
}

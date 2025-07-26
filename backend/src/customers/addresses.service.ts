import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseCrudService } from '../common/application/base-crud.service';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAllAddressesDto } from './dto/find-all-addresses.dto';
import { AddressRepository } from './infrastructure/persistence/address.repository';
import { ADDRESS_REPOSITORY } from '../common/tokens';

@Injectable()
export class AddressesService extends BaseCrudService<
  Address,
  CreateAddressDto,
  UpdateAddressDto,
  FindAllAddressesDto
> {
  constructor(
    @Inject(ADDRESS_REPOSITORY) protected readonly repo: AddressRepository,
  ) {
    super(repo);
  }


  async setDefaultAddress(
    customerId: string,
    addressId: string,
  ): Promise<void> {
    const address = await this.repo.findById(addressId);
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }
    if (address.isDefault) {
      return;
    }

    await this.unsetDefaultForOtherAddresses(customerId, addressId);
    await this.repo.update(addressId, { isDefault: true });
  }

  async unsetDefaultForOtherAddresses(
    customerId: string,
    excludeAddressId?: string,
  ): Promise<void> {
    const currentAddresses = await this.findAll({ customerId });
    for (const addr of currentAddresses) {
      if (addr.isDefault && addr.id !== excludeAddressId) {
        await this.repo.update(addr.id, { isDefault: false });
      }
    }
  }
}

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { BaseCrudService } from '../common/application/base-crud.service';
import { Address } from './domain/address';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAllAddressesDto } from './dto/find-all-addresses.dto'; // Importar el DTO real
import { AddressRepository } from './infrastructure/persistence/address.repository';
import { ADDRESS_REPOSITORY } from '../common/tokens';

// Eliminar el tipo placeholder

@Injectable()
export class AddressesService extends BaseCrudService<
  Address,
  CreateAddressDto,
  UpdateAddressDto,
  FindAllAddressesDto // Usar el DTO de filtro real
> {
  constructor(
    @Inject(ADDRESS_REPOSITORY) protected readonly repo: AddressRepository,
  ) {
    super(repo);
  }

  // --- Métodos específicos para Direcciones ---
  // (Se moverán aquí desde CustomersService en el siguiente paso)

  // El método findByCustomerId se elimina, se usa this.findAll({ customerId }) en su lugar.

  // --- Métodos específicos para Direcciones ---

  async setDefaultAddress(
    customerId: string, // Necesitamos verificar la pertenencia al cliente
    addressId: string,
  ): Promise<void> {
    const address = await this.repo.findById(addressId);
    // Verificar que la dirección existe y pertenece al cliente
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException(
        `Dirección con ID ${addressId} no encontrada o no pertenece al cliente ${customerId}.`,
      );
    }
    if (address.isDefault) {
      return; // Ya es la predeterminada
    }

    // Quitar la marca 'default' de otras direcciones del mismo cliente
    await this.unsetDefaultForOtherAddresses(customerId, addressId);
    // Marcar la dirección actual como 'default'
    await this.repo.update(addressId, { isDefault: true });
  }

  async unsetDefaultForOtherAddresses(
    customerId: string,
    excludeAddressId?: string,
  ): Promise<void> {
    // Usar findAll con filtro
    const currentAddresses = await this.findAll({ customerId });
    for (const addr of currentAddresses) {
      // Si es default y no es la que estamos excluyendo, quitarle la marca
      if (addr.isDefault && addr.id !== excludeAddressId) {
        await this.repo.update(addr.id, { isDefault: false });
      }
    }
  }

  // Método findByCustomerId (ya estaba como ejemplo, lo eliminamos porque ya existe en la interfaz del repo y se puede llamar via this.findAll)
  // async findByCustomerId(customerId: string): Promise<Address[]> {
  //   return this.findAll({ customerId });
  // }
}

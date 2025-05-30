import { Injectable } from '@nestjs/common'; // Eliminar NotFoundException, InternalServerErrorException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm'; // Eliminar In, Mover ILike aquí
import { AddressEntity } from '../entities/address.entity';
import { AddressRepository } from '../../address.repository';
import { Address } from '../../../../domain/address';
import { AddressMapper } from '../mappers/address.mapper';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository'; // Importar Base
import { CreateAddressDto } from '../../../../dto/create-address.dto'; // Importar DTOs
import { UpdateAddressDto } from '../../../../dto/update-address.dto';
import { FindAllAddressesDto } from '../../../../dto/find-all-addresses.dto'; // Importar el DTO real
// Importar ILike para búsqueda parcial ya está arriba

// Eliminar el tipo placeholder

@Injectable() // Implementar la interfaz AddressRepository
export class AddressRelationalRepository
  extends BaseRelationalRepository<
    // Extender BaseRelationalRepository
    AddressEntity,
    Address,
    FindAllAddressesDto, // Usar el DTO de filtro real
    CreateAddressDto,
    UpdateAddressDto
  >
  implements AddressRepository
{
  constructor(
    @InjectRepository(AddressEntity)
    ormRepo: Repository<AddressEntity>, // Cambiar nombre de variable inyectada
    mapper: AddressMapper, // Cambiar nombre de variable inyectada
  ) {
    super(ormRepo, mapper); // Llamar al constructor de la clase base
  }

  // Implementar buildWhere para manejar filtros específicos de Address
  protected override buildWhere(
    filter?: FindAllAddressesDto,
  ): FindOptionsWhere<AddressEntity> | undefined {
    const where: FindOptionsWhere<AddressEntity> = {};

    if (filter?.customerId) {
      where.customerId = filter.customerId;
    }
    if (filter?.isDefault !== undefined) {
      where.isDefault = filter.isDefault;
    }
    if (filter?.zipCode) {
      where.zipCode = filter.zipCode;
    }
    if (filter?.city) {
      // Añadir filtro por ciudad
      where.city = ILike(`%${filter.city}%`);
    }
    // Añadir más filtros si es necesario (street, state, etc.)

    return Object.keys(where).length > 0 ? where : undefined;
  }

  // Los métodos findByCustomerId, save y removeMany se eliminan.
  // La funcionalidad se hereda o se maneja a través de BaseRelationalRepository.
}

import { Injectable } from '@nestjs/common'; // Eliminar NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  ILike,
  Repository,
  // DeepPartial as TypeOrmDeepPartial no se usa
} from 'typeorm';
import { CustomerEntity } from '../entities/customer.entity';
import { CustomerRepository } from '../../customer.repository';
import { Customer } from '../../../../domain/customer';
import { CustomerMapper } from '../mappers/customer.mapper';
// IPaginationOptions no se usa
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FindAllCustomersDto } from '../../../../dto/find-all-customers.dto';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository'; // Importar Base
import { CreateCustomerDto } from '../../../../dto/create-customer.dto'; // Importar DTOs
import { UpdateCustomerDto } from '../../../../dto/update-customer.dto';

@Injectable()
export class CustomerRelationalRepository
  extends BaseRelationalRepository< // Extender BaseRelationalRepository
    CustomerEntity,
    Customer,
    FindAllCustomersDto,
    CreateCustomerDto, // Añadir DTOs de Create y Update
    UpdateCustomerDto
  >
  implements CustomerRepository // Implementar la interfaz CustomerRepository
{
  constructor(
    @InjectRepository(CustomerEntity)
    ormRepo: Repository<CustomerEntity>, // Cambiar nombre de variable inyectada
    mapper: CustomerMapper, // Cambiar nombre de variable inyectada
  ) {
    super(ormRepo, mapper); // Llamar al constructor de la clase base
  }

  // Implementar buildWhere para manejar filtros
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
    if (filter?.phoneNumber) {
      where.phoneNumber = filter.phoneNumber;
    }

    // Devolver undefined si no hay filtros para evitar un objeto `where` vacío
    return Object.keys(where).length > 0 ? where : undefined;
  }


  // Se elimina findManyWithPagination

  // Mantener métodos específicos de CustomerRepository
  async findByEmail(email: Customer['email']): Promise<NullableType<Customer>> {
    if (!email) return null;
    const entity = await this.ormRepo.findOne({ // Usar this.ormRepo
      where: { email },
      relations: ['addresses'],
    });
    return entity ? this.mapper.toDomain(entity) : null; // Usar this.mapper
  }

  async findByPhone(
    phone: Customer['phoneNumber'],
  ): Promise<NullableType<Customer>> {
    if (!phone) return null;
    const entity = await this.ormRepo.findOne({ // Usar this.ormRepo
      where: { phoneNumber: phone },
      relations: ['addresses'],
    });
    return entity ? this.mapper.toDomain(entity) : null; // Usar this.mapper
  }

  // El método 'save' se elimina. Las operaciones de guardado se manejan
  // a través de los métodos heredados create y update de BaseRelationalRepository.

  // Los métodos create, findById, findAll (sin paginación), update, remove son heredados de BaseRelationalRepository
  // No es necesario re-implementarlos aquí a menos que se necesite lógica adicional específica.
}

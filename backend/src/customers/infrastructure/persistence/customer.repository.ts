import { NullableType } from '../../../utils/types/nullable.type';
// IPaginationOptions no se usa
import { Customer } from '../../domain/customer';
import { FindAllCustomersDto } from '../../dto/find-all-customers.dto';
import { IBaseRepository } from '../../../common/domain/repositories/base.repository'; // Importar IBaseRepository
import { CreateCustomerDto } from '../../dto/create-customer.dto'; // Importar DTOs
import { UpdateCustomerDto } from '../../dto/update-customer.dto';
// DeepPartial de typeorm no se usa

// Extender IBaseRepository con los tipos específicos
export abstract class CustomerRepository
  implements
    IBaseRepository<
      // Cambiado 'extends' por 'implements'
      Customer,
      FindAllCustomersDto,
      CreateCustomerDto,
      UpdateCustomerDto
    >
{
  // Declarar los métodos abstractos de IBaseRepository explícitamente
  // aunque la implementación venga de BaseRelationalRepository
  abstract create(data: CreateCustomerDto): Promise<Customer>;
  abstract findById(id: Customer['id']): Promise<NullableType<Customer>>;
  abstract findAll(filter?: FindAllCustomersDto): Promise<Customer[]>;
  abstract update(
    id: Customer['id'],
    payload: UpdateCustomerDto,
  ): Promise<NullableType<Customer>>;
  abstract remove(id: Customer['id']): Promise<void>;

  // Mantener métodos específicos que no están en IBaseRepository

  abstract findByEmail(
    email: Customer['email'],
  ): Promise<NullableType<Customer>>;

  abstract findByPhone(
    phone: Customer['phoneNumber'],
  ): Promise<NullableType<Customer>>;

  abstract findBannedCustomers(): Promise<Customer[]>;

  // El método 'save' se elimina. Las operaciones de guardado se manejan
  // a través de los métodos heredados create y update de IBaseRepository.

  // findAll(filter?: FindAllCustomersDto): Promise<Customer[]>; // Ya heredado
}

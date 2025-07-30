import { NullableType } from '../../../utils/types/nullable.type';
import { Customer } from '../../domain/customer';
import { FindAllCustomersDto } from '../../dto/find-all-customers.dto';
import { IBaseRepository } from '../../../common/domain/repositories/base.repository';
import { CreateCustomerDto } from '../../dto/create-customer.dto';
import { UpdateCustomerDto } from '../../dto/update-customer.dto';
export abstract class CustomerRepository
  implements
    IBaseRepository<
      Customer,
      FindAllCustomersDto,
      CreateCustomerDto,
      UpdateCustomerDto
    >
{
  abstract create(data: CreateCustomerDto): Promise<Customer>;
  abstract findById(id: Customer['id']): Promise<NullableType<Customer>>;
  abstract findAll(filter?: FindAllCustomersDto): Promise<Customer[]>;
  abstract update(
    id: Customer['id'],
    payload: UpdateCustomerDto,
  ): Promise<NullableType<Customer>>;
  abstract remove(id: Customer['id']): Promise<void>;

  abstract findByEmail(
    email: Customer['email'],
  ): Promise<NullableType<Customer>>;

  abstract findByPhone(
    phone: Customer['whatsappPhoneNumber'],
  ): Promise<NullableType<Customer>>;

  abstract findBannedCustomers(): Promise<Customer[]>;
}

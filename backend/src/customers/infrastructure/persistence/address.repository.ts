import { NullableType } from '../../../utils/types/nullable.type';
import { Address } from '../../domain/address';
import { IBaseRepository } from '../../../common/domain/repositories/base.repository';
import { CreateAddressDto } from '../../dto/create-address.dto';
import { UpdateAddressDto } from '../../dto/update-address.dto';
import { FindAllAddressesDto } from '../../dto/find-all-addresses.dto';
export abstract class AddressRepository
  implements
    IBaseRepository<
      Address,
      FindAllAddressesDto,
      CreateAddressDto,
      UpdateAddressDto
    >
{
  abstract create(data: CreateAddressDto): Promise<Address>;
  abstract findById(id: Address['id']): Promise<NullableType<Address>>;
  abstract findAll(filter?: FindAllAddressesDto): Promise<Address[]>;
  abstract update(
    id: Address['id'],
    payload: UpdateAddressDto,
  ): Promise<NullableType<Address>>;
  abstract remove(id: Address['id']): Promise<void>;
}

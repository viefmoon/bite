import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { Address, AddressFormInputs } from '../schema/customer.schema';

async function create(
  customerId: string,
  data: AddressFormInputs,
): Promise<Address> {
  const response = await apiClient.post<Address>(
    API_PATHS.ADDRESSES_BY_CUSTOMER.replace(':customerId', customerId),
    data,
  );
  return response.data;
}

async function update(
  addressId: string,
  data: Partial<AddressFormInputs>,
): Promise<Address> {
  const response = await apiClient.patch<Address>(
    API_PATHS.ADDRESSES_BY_ID.replace(':id', addressId),
    data,
  );
  return response.data;
}

async function remove(addressId: string): Promise<void> {
  await apiClient.delete(API_PATHS.ADDRESSES_BY_ID.replace(':id', addressId));
}

export const addressesService = {
  create,
  update,
  remove,
};

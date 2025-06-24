import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
} from '../types/customer.types';

async function create(
  customerId: string,
  data: CreateAddressDto,
): Promise<Address> {
  const response = await apiClient.post<Address>(
    `${API_PATHS.CUSTOMERS}/${customerId}/addresses`,
    data,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function update(
  addressId: string,
  data: UpdateAddressDto,
): Promise<Address> {
  const response = await apiClient.patch<Address>(
    `${API_PATHS.ADDRESSES}/${addressId}`,
    data,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function remove(addressId: string): Promise<void> {
  const response = await apiClient.delete(
    `${API_PATHS.ADDRESSES}/${addressId}`,
  );
  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

export const addressesService = {
  create,
  update,
  remove,
};

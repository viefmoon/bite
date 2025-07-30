import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Customer,
  FindAllCustomersQuery,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../schema/customer.schema';

async function findAll(params?: FindAllCustomersQuery): Promise<Customer[]> {
  const response = await apiClient.get<Customer[]>(API_PATHS.CUSTOMERS, {
    params,
  });
  return response.data;
}

async function create(data: CreateCustomerInput): Promise<Customer> {
  const response = await apiClient.post<Customer>(API_PATHS.CUSTOMERS, data);
  return response.data;
}

async function update(
  id: string,
  data: UpdateCustomerInput,
): Promise<Customer> {
  const response = await apiClient.patch<Customer>(
    API_PATHS.CUSTOMERS_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(API_PATHS.CUSTOMERS_BY_ID.replace(':id', id));
}

export const customersService = {
  findAll,
  create,
  update,
  remove,
};

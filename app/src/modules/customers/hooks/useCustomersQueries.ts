import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { useApiMutation } from '@/app/hooks/useApiMutation';

import { customersService } from '../services/customersService';
import {
  FindAllCustomersQuery,
  Address,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../schema/customer.schema';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: FindAllCustomersQuery) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  addresses: (customerId: string) =>
    [...customerKeys.all, 'addresses', customerId] as const,
};

export function useCustomers(filters?: FindAllCustomersQuery) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customersService.findAll(filters),
  });
}

export function useCreateCustomer() {
  return useApiMutation(
    (data: CreateCustomerInput) => customersService.create(data),
    {
      successMessage: 'Cliente creado exitosamente',
      invalidateQueryKeys: [customerKeys.lists()],
    },
  );
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useApiMutation(
    ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      customersService.update(id, data),
    {
      successMessage: 'Cliente actualizado exitosamente',
      invalidateQueryKeys: [customerKeys.lists()],
      onSuccess: (updatedCustomer) => {
        queryClient.setQueryData(
          customerKeys.detail(updatedCustomer.id),
          updatedCustomer,
        );
      },
    },
  );
}

export function useDeleteCustomer() {
  return useApiMutation((id: string) => customersService.remove(id), {
    successMessage: 'Cliente eliminado exitosamente',
    invalidateQueryKeys: [customerKeys.lists()],
  });
}

export function useGetAddressesByCustomer(
  customerId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: customerKeys.addresses(customerId),
    queryFn: async () => {
      try {
        const response = await apiClient.get<Address[]>(
          `${API_PATHS.CUSTOMERS}/${customerId}/addresses`,
        );
        return response.data;
      } catch (error) {
        return [];
      }
    },
    enabled: options?.enabled ?? true,
  });
}

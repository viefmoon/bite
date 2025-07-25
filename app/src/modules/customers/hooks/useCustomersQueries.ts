import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../services/customersService';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  FindAllCustomersQuery,
  ChatMessage,
  Address,
} from '../types/customer.types';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';

// Keys para React Query
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: FindAllCustomersQuery) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  activeRecent: (daysAgo: number) =>
    [...customerKeys.all, 'active-recent', daysAgo] as const,
  addresses: (customerId: string) =>
    [...customerKeys.all, 'addresses', customerId] as const,
};

// Hook para obtener todos los clientes
export function useCustomers(filters?: FindAllCustomersQuery) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customersService.findAll(filters),
  });
}

// Hook para obtener un cliente específico
export function useCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersService.findOne(id),
    enabled: enabled && !!id,
  });
}

// Hook para crear un cliente
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerDto) => customersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Hook para actualizar un cliente
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDto }) =>
      customersService.update(id, data),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer,
      );
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Hook para eliminar un cliente
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Hook para agregar mensaje al chat
export function useAppendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      message,
    }: {
      customerId: string;
      message: Omit<ChatMessage, 'timestamp'>;
    }) => customersService.appendChatMessage(customerId, message),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer,
      );
    },
  });
}

// Hook para actualizar historial relevante
export function useUpdateRelevantChatHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      relevantHistory,
    }: {
      customerId: string;
      relevantHistory: ChatMessage[];
    }) =>
      customersService.updateRelevantChatHistory(customerId, relevantHistory),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer,
      );
    },
  });
}

// Hook para actualizar estadísticas
export function useUpdateCustomerStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      stats,
    }: {
      customerId: string;
      stats: { totalOrders?: number; totalSpent?: number };
    }) => customersService.updateCustomerStats(customerId, stats),
    onSuccess: (updatedCustomer) => {
      queryClient.setQueryData(
        customerKeys.detail(updatedCustomer.id),
        updatedCustomer,
      );
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Hook para obtener clientes activos con interacción reciente
export function useActiveCustomersWithRecentInteraction(daysAgo = 30) {
  return useQuery({
    queryKey: customerKeys.activeRecent(daysAgo),
    queryFn: () => customersService.getActiveWithRecentInteraction(daysAgo),
  });
}

// Hook para obtener direcciones de un cliente
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
        // Si hay error al obtener direcciones, retornar array vacío
        return [];
      }
    },
    enabled: options?.enabled ?? true,
  });
}

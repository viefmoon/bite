import { useMemo } from 'react';

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import type { Order } from '../../../app/schemas/domain/order.schema';
import type { OrderDetailsForBackend } from '../stores/useOrderStore';
import type { FindAllOrdersDto, OrderOpenList } from '../schema/orders.schema';
import { ApiError } from '@/app/lib/errors';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import type { UpdateOrderPayload } from '../schema/update-order.schema';

// Query Keys
const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: FindAllOrdersDto) => [...orderKeys.lists(), filters] as const,
  openOrdersList: () => [...orderKeys.all, 'list', 'open-orders-list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

/**
 * Hook para crear una nueva orden.
 */
export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, OrderDetailsForBackend>({
    mutationFn: orderService.createOrder,
    onSuccess: () => {
      // Invalidar queries relevantes si es necesario (ej. lista de órdenes)
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      // Invalidar queries de mesas para reflejar cambios de disponibilidad
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      // El mensaje de éxito se maneja en el componente que llama a la mutación
    },
    onError: (_error) => {
      // El mensaje de error se maneja en el componente que llama a la mutación
    },
  });
};

/**
 * Hook para actualizar una orden existente.
 */
export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Definir el tipo de las variables de la mutación
  type UpdateVariables = { orderId: string; payload: UpdateOrderPayload };

  return useMutation<Order, ApiError, UpdateVariables>({
    mutationFn: ({ orderId, payload }) =>
      orderService.updateOrder(orderId, payload),
    onSuccess: (updatedOrder, variables) => {
      // Invalidar queries relevantes para refrescar datos
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.openOrdersList() });
      queryClient.invalidateQueries({
        queryKey: [...orderKeys.details(), variables.orderId],
      });

      // Invalidar queries de mesas para reflejar cambios de disponibilidad
      queryClient.invalidateQueries({ queryKey: ['tables'] });

      showSnackbar({
        message: `Orden #${updatedOrder.shiftOrderNumber} actualizada`,
        type: 'success',
      });
    },
    onError: (error, variables) => {
      const message = getApiErrorMessage(error);
      showSnackbar({
        message: `Error al actualizar orden #${variables.orderId}: ${message}`,
        type: 'error',
      });
    },
  });
};

/**
 * Hook para cancelar una orden.
 */
export const useCancelOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<Order, ApiError, string>({
    mutationFn: (orderId) => orderService.cancelOrder(orderId),
    onSuccess: (cancelledOrder, orderId) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.openOrdersList() });
      queryClient.invalidateQueries({
        queryKey: [...orderKeys.details(), orderId],
      });
      // Invalidar queries de mesas para reflejar cambios de disponibilidad
      queryClient.invalidateQueries({ queryKey: ['tables'] });

      showSnackbar({
        message: `Orden #${cancelledOrder.shiftOrderNumber} cancelada`,
        type: 'info',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({
        message: `Error al cancelar orden: ${message}`,
        type: 'error',
      });
    },
  });
};

/**
 * Hook para completar una orden (cambiar estado a COMPLETED).
 */
export const useCompleteOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation<Order, ApiError, string>({
    mutationFn: (orderId) =>
      orderService.updateOrder(orderId, { orderStatus: 'COMPLETED' }),
    onSuccess: (completedOrder, orderId) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.openOrdersList() });
      queryClient.invalidateQueries({
        queryKey: [...orderKeys.details(), orderId],
      });

      showSnackbar({
        message: `Orden #${completedOrder.shiftOrderNumber} finalizada exitosamente`,
        type: 'success',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showSnackbar({
        message: `Error al finalizar orden: ${message}`,
        type: 'error',
      });
    },
  });
};

/**
 * Hook optimizado para obtener las órdenes abiertas con campos mínimos.
 */
export const useGetOpenOrdersListQuery = (options?: {
  enabled?: boolean;
}): UseQueryResult<OrderOpenList[], ApiError> => {
  const queryKey = orderKeys.openOrdersList();

  return useQuery<OrderOpenList[], ApiError>({
    queryKey: queryKey,
    queryFn: () => orderService.getOpenOrdersList(),
    enabled: options?.enabled ?? true,
    refetchInterval: 10000, // Actualizar cada 10 segundos
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook para obtener los detalles completos de una orden por su ID.
 */
export const useGetOrderByIdQuery = (
  orderId: string | null | undefined,
  options?: { enabled?: boolean },
): UseQueryResult<Order, ApiError> => {
  // Definir la clave de detalle usando el orderId
  const detailQueryKey = useMemo(
    () =>
      orderId ? [...orderKeys.details(), orderId] : [...orderKeys.details()],
    [orderId],
  );

  return useQuery<Order, ApiError>({
    queryKey: detailQueryKey,
    queryFn: async () => {
      if (!orderId) {
        // Si no hay orderId, no intentar hacer fetch y devolver un error o estado inicial
        return Promise.reject(new Error('Order ID no proporcionado'));
      }
      const order = await orderService.getOrderById(orderId);
      return order;
    },
    enabled: !!orderId && (options?.enabled ?? true), // Habilitar solo si hay orderId y está habilitado externamente
    staleTime: 0, // Los datos del detalle de la orden siempre deben estar frescos
    gcTime: 0, // No mantener en caché - siempre refetchear cuando se necesite
    refetchOnMount: 'always', // Siempre refetchear cuando el componente se monta
    refetchOnWindowFocus: true, // Refetchear cuando la ventana recupera el foco
  });
};

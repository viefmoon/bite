import { useMemo } from 'react';

import {
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { orderService, orderKeys } from '@/app/services/orderService';
import { ORDER_FILTER_PRESETS } from '@/app/types/order-filters.types';
import type { Order } from '../../../app/schemas/domain/order.schema';
import type { OrderDetailsForBackend } from '../utils/orderUtils';
import { ApiError } from '@/app/lib/errors';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import type { UpdateOrderPayload } from '../schema/update-order.schema';
import { useApiMutation } from '@/app/hooks/useApiMutation';

/**
 * Hook para crear una nueva orden.
 */
export const useCreateOrderMutation = () => {
  return useApiMutation<Order, ApiError, OrderDetailsForBackend>(
    orderService.createOrder,
    {
      invalidateQueryKeys: [orderKeys.lists(), ['tables']],
      suppressSuccessMessage: true, // El mensaje de éxito se maneja en el componente que llama a la mutación
      suppressErrorMessage: true, // El mensaje de error se maneja en el componente que llama a la mutación
    },
  );
};

/**
 * Hook para actualizar una orden existente.
 */
export const useUpdateOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  // Definir el tipo de las variables de la mutación
  type UpdateVariables = { orderId: string; payload: UpdateOrderPayload };

  return useApiMutation<Order, ApiError, UpdateVariables>(
    ({ orderId, payload }) => orderService.updateOrder(orderId, payload),
    {
      invalidateQueryKeys: [
        orderKeys.lists(),
        orderKeys.openOrdersList(),
        ['tables'],
      ],
      suppressSuccessMessage: true, // Manejamos mensaje personalizado en onSuccess
      suppressErrorMessage: true, // Manejamos mensaje personalizado en onError
      onSuccess: (updatedOrder, variables) => {
        // Invalidar query específica del detalle de la orden
        queryClient.invalidateQueries({
          queryKey: [...orderKeys.details(), variables.orderId],
        });

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
    },
  );
};

/**
 * Hook para cancelar una orden.
 */
export const useCancelOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useApiMutation<Order, ApiError, string>(
    (orderId) => orderService.cancelOrder(orderId),
    {
      invalidateQueryKeys: [
        orderKeys.lists(),
        orderKeys.openOrdersList(),
        ['tables'],
      ],
      suppressSuccessMessage: true, // Manejamos mensaje personalizado en onSuccess
      suppressErrorMessage: true, // Manejamos mensaje personalizado en onError
      onSuccess: (cancelledOrder, orderId) => {
        // Invalidar query específica del detalle de la orden
        queryClient.invalidateQueries({
          queryKey: [...orderKeys.details(), orderId],
        });

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
    },
  );
};

/**
 * Hook para completar una orden (cambiar estado a COMPLETED).
 */
export const useCompleteOrderMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useApiMutation<Order, ApiError, string>(
    (orderId) => orderService.updateOrder(orderId, { status: 'COMPLETED' }),
    {
      invalidateQueryKeys: [orderKeys.lists(), orderKeys.openOrdersList()],
      suppressSuccessMessage: true, // Manejamos mensaje personalizado en onSuccess
      suppressErrorMessage: true, // Manejamos mensaje personalizado en onError
      onSuccess: (completedOrder, orderId) => {
        // Invalidar query específica del detalle de la orden
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
    },
  );
};

/**
 * Hook optimizado para obtener las órdenes abiertas con campos mínimos.
 */
export const useGetOpenOrdersListQuery = (options?: {
  enabled?: boolean;
}): UseQueryResult<Order[], ApiError> => {
  const queryKey = orderKeys.openOrdersList();

  return useQuery<Order[], ApiError>({
    queryKey: queryKey,
    queryFn: () => orderService.getOrders(ORDER_FILTER_PRESETS.open()),
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

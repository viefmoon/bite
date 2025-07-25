import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { KitchenFilters } from '../types/kitchen.types';
import { useKitchenSnackbar } from './useKitchenSnackbar';

export const KITCHEN_ORDERS_KEY = 'kitchen-orders';

export function useKitchenOrders(filters: Partial<KitchenFilters> = {}) {
  return useQuery({
    queryKey: [KITCHEN_ORDERS_KEY, filters],
    queryFn: () => kitchenService.getKitchenOrders(filters),
    refetchInterval: 10000, // Actualizar cada 10 segundos
    refetchIntervalInBackground: false, // No actualizar cuando la app está en background
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000, // Los datos se consideran frescos por 5 segundos
    // IMPORTANTE: Mantener datos previos durante refetch para evitar parpadeos
    keepPreviousData: true,
    // No mostrar loading en refetch para mantener la UI estable
    notifyOnChangeProps: ['data', 'error'],
  });
}

export function useMarkItemPrepared() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  return useMutation({
    mutationFn: ({
      itemId,
      isPrepared,
    }: {
      itemId: string;
      isPrepared: boolean;
    }) => kitchenService.markItemPrepared(itemId, isPrepared),
    onMutate: async ({ itemId, isPrepared }) => {
      // Cancelar refetches para evitar sobrescribir la actualización optimista
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });

      // Guardar estado previo para rollback
      const previousOrders = queryClient.getQueryData([KITCHEN_ORDERS_KEY]);

      // Actualizar optimistamente
      queryClient.setQueryData([KITCHEN_ORDERS_KEY], (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((order: any) => ({
            ...order,
            items: order.items?.map((item: any) =>
              item.id === itemId
                ? {
                    ...item,
                    preparationStatus: isPrepared ? 'READY' : 'IN_PROGRESS',
                    preparedAt: isPrepared ? new Date().toISOString() : null,
                  }
                : item,
            ),
          })),
        };
      });

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      // Rollback en caso de error
      if (context?.previousOrders) {
        queryClient.setQueryData([KITCHEN_ORDERS_KEY], context.previousOrders);
      }
      showError(error.response?.data?.message || 'Error al actualizar el item');
    },
    onSettled: () => {
      // Refrescar datos del servidor
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
    },
  });
}

export function useStartOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.startOrderPreparation(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      const previousOrders = queryClient.getQueryData([KITCHEN_ORDERS_KEY]);

      queryClient.setQueryData([KITCHEN_ORDERS_KEY], (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((order: any) =>
            order.id === orderId
              ? {
                  ...order,
                  myScreenStatus: 'IN_PREPARATION',
                  preparationStartedAt: new Date().toISOString(),
                }
              : order,
          ),
        };
      });

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData([KITCHEN_ORDERS_KEY], context.previousOrders);
      }
      showError(
        error.response?.data?.message || 'Error al iniciar preparación',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
    },
  });
}

export function useCancelOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.cancelOrderPreparation(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      const previousOrders = queryClient.getQueryData([KITCHEN_ORDERS_KEY]);

      queryClient.setQueryData([KITCHEN_ORDERS_KEY], (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((order: any) =>
            order.id === orderId
              ? {
                  ...order,
                  myScreenStatus: 'PENDING',
                  preparationStartedAt: null,
                  items: order.items?.map((item: any) => ({
                    ...item,
                    preparationStatus: item.belongsToMyScreen
                      ? 'IN_PROGRESS'
                      : item.preparationStatus,
                    preparedAt: item.belongsToMyScreen ? null : item.preparedAt,
                  })),
                }
              : order,
          ),
        };
      });

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData([KITCHEN_ORDERS_KEY], context.previousOrders);
      }
      showError(
        error.response?.data?.message || 'Error al cancelar preparación',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
    },
  });
}

export function useCompleteOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.completeOrderPreparation(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      const previousOrders = queryClient.getQueryData([KITCHEN_ORDERS_KEY]);

      queryClient.setQueryData([KITCHEN_ORDERS_KEY], (old: any) => {
        if (!old?.data) return old;

        return {
          ...old,
          data: old.data.map((order: any) =>
            order.id === orderId
              ? {
                  ...order,
                  myScreenStatus: 'READY',
                  preparationCompletedAt: new Date().toISOString(),
                }
              : order,
          ),
        };
      });

      return { previousOrders };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData([KITCHEN_ORDERS_KEY], context.previousOrders);
      }
      showError(
        error.response?.data?.message || 'Error al completar preparación',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
    },
  });
}

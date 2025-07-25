import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { KitchenFilters } from '../types/kitchen.types';
import { useKitchenSnackbar } from './useKitchenSnackbar';

export const KITCHEN_ORDERS_KEY = 'kitchen-orders';

/**
 * Hook principal para obtener órdenes de cocina
 * Optimizado con refetch cada 30 segundos para balance entre actualización y rendimiento
 */
export function useKitchenOrders(filters: Partial<KitchenFilters> = {}) {
  return useQuery({
    queryKey: [KITCHEN_ORDERS_KEY, filters],
    queryFn: () => kitchenService.getKitchenOrders(filters),
    refetchInterval: 30000, // Refetch cada 30 segundos - balance óptimo
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 25000, // Datos frescos por 25 segundos
    gcTime: 5 * 60 * 1000, // Cache por 5 minutos
    keepPreviousData: true, // Evitar parpadeos durante refetch
    notifyOnChangeProps: ['data', 'error'],
  });
}

/**
 * Hook para marcar items como preparados con actualización optimista granular
 * No invalida toda la query, solo actualiza el item específico
 */
export function useUpdateKitchenItem() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  const updateAllQueriesForItem = (itemId: string, isPrepared: boolean) => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    const previousData: any[] = [];

    queries.forEach((query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === KITCHEN_ORDERS_KEY) {
        const oldData = query.state.data;
        if (oldData) {
          previousData.push([queryKey, oldData]);
          
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old || !Array.isArray(old)) return old;

            return old.map((order: any) => ({
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
            }));
          });
        }
      }
    });

    return previousData;
  };

  const rollbackAllQueries = (previousData: any[]) => {
    previousData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  return useMutation({
    mutationFn: ({
      itemId,
      isPrepared,
    }: {
      itemId: string;
      isPrepared: boolean;
    }) => kitchenService.markItemPrepared(itemId, isPrepared),
    
    onMutate: async ({ itemId, isPrepared }) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      const previousData = updateAllQueriesForItem(itemId, isPrepared);
      return { previousData };
    },
    
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        rollbackAllQueries(context.previousData);
      }
      showError(error.response?.data?.message || 'Error al actualizar el item');
    },
    
    // NO invalidar inmediatamente - dejar que el background refetch se encargue
    onSettled: () => {
      // Invalidar después de 2 segundos para permitir ver el cambio optimista
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: [KITCHEN_ORDERS_KEY],
          refetchType: 'none' // Solo marcar como stale, no refetch inmediato
        });
      }, 2000);
    },
  });
}

/**
 * Hook para iniciar preparación de órdenes con actualización optimista granular
 */
export function useUpdateKitchenOrderStatus() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  const updateAllQueriesForOrder = (orderId: string, status: string, extraUpdates?: any) => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    const previousData: any[] = [];

    queries.forEach((query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === KITCHEN_ORDERS_KEY) {
        const oldData = query.state.data;
        if (oldData) {
          previousData.push([queryKey, oldData]);
          
          queryClient.setQueryData(queryKey, (old: any) => {
            if (!old || !Array.isArray(old)) return old;

            return old.map((order: any) =>
              order.id === orderId
                ? {
                    ...order,
                    myScreenStatus: status,
                    preparationStartedAt:
                      status === 'IN_PREPARATION'
                        ? new Date().toISOString()
                        : order.preparationStartedAt,
                    preparationCompletedAt:
                      status === 'READY'
                        ? new Date().toISOString()
                        : order.preparationCompletedAt,
                    // Si se cancela, resetear items
                    items:
                      status === 'PENDING'
                        ? order.items?.map((item: any) => ({
                            ...item,
                            preparationStatus: item.belongsToMyScreen
                              ? 'IN_PROGRESS'
                              : item.preparationStatus,
                            preparedAt: item.belongsToMyScreen
                              ? null
                              : item.preparedAt,
                          }))
                        : order.items,
                    ...extraUpdates,
                  }
                : order,
            );
          });
        }
      }
    });

    return previousData;
  };

  const rollbackAllQueries = (previousData: any[]) => {
    previousData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  return {
    // Función genérica para actualizar status
    updateStatus: useMutation({
      mutationFn: ({ orderId, status, serverAction }: { 
        orderId: string; 
        status: string; 
        serverAction: () => Promise<any>;
      }) => serverAction(),
      
      onMutate: async ({ orderId, status }) => {
        await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
        const previousData = updateAllQueriesForOrder(orderId, status);
        return { previousData };
      },
      
      onError: (error: any, variables, context) => {
        if (context?.previousData) {
          rollbackAllQueries(context.previousData);
        }
        showError(error.response?.data?.message || 'Error al actualizar orden');
      },
      
      onSettled: () => {
        setTimeout(() => {
          queryClient.invalidateQueries({ 
            queryKey: [KITCHEN_ORDERS_KEY],
            refetchType: 'none'
          });
        }, 2000);
      },
    }),
    
    // Helpers específicos
    startPreparation: (orderId: string) => ({
      orderId,
      status: 'IN_PREPARATION',
      serverAction: () => kitchenService.startOrderPreparation(orderId)
    }),
    
    cancelPreparation: (orderId: string) => ({
      orderId,
      status: 'PENDING', 
      serverAction: () => kitchenService.cancelOrderPreparation(orderId)
    }),
    
    completePreparation: (orderId: string) => ({
      orderId,
      status: 'READY',
      serverAction: () => kitchenService.completeOrderPreparation(orderId)
    }),
  };
}

/**
 * Hook de conveniencia para iniciar preparación
 */
export function useStartOrderPreparation() {
  const { updateStatus, startPreparation } = useUpdateKitchenOrderStatus();
  
  return useMutation({
    mutationFn: (orderId: string) => {
      const params = startPreparation(orderId);
      return updateStatus.mutateAsync(params);
    },
  });
}

/**
 * Hook de conveniencia para cancelar preparación
 */
export function useCancelOrderPreparation() {
  const { updateStatus, cancelPreparation } = useUpdateKitchenOrderStatus();
  
  return useMutation({
    mutationFn: (orderId: string) => {
      const params = cancelPreparation(orderId);
      return updateStatus.mutateAsync(params);
    },
  });
}

/**
 * Hook de conveniencia para completar preparación
 */
export function useCompleteOrderPreparation() {
  const { updateStatus, completePreparation } = useUpdateKitchenOrderStatus();
  
  return useMutation({
    mutationFn: (orderId: string) => {
      const params = completePreparation(orderId);
      return updateStatus.mutateAsync(params);
    },
  });
}

/**
 * Hook de conveniencia para marcar items como preparados
 * Mantiene la API existente para compatibilidad
 */
export function useMarkItemPrepared() {
  const updateItem = useUpdateKitchenItem();
  
  return useMutation({
    mutationFn: ({ itemId, isPrepared }: { itemId: string; isPrepared: boolean }) => {
      return updateItem.mutateAsync({ itemId, isPrepared });
    },
  });
}

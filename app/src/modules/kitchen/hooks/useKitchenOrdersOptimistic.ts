import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { KitchenFilters } from '../types/kitchen.types';
import { useKitchenSnackbar } from './useKitchenSnackbar';
import { useOptimisticUpdate } from './useOptimisticKitchenOrders';

export const KITCHEN_ORDERS_KEY = 'kitchen-orders';

export function useKitchenOrders(filters: Partial<KitchenFilters> = {}) {
  return useQuery({
    queryKey: [KITCHEN_ORDERS_KEY, filters],
    queryFn: () => kitchenService.getKitchenOrders(filters),
    refetchInterval: 30000, // Aumentar a 30 segundos para no interferir
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 60000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
    keepPreviousData: true,
  });
}

export function useMarkItemPrepared() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();
  const { updateAllQueries, rollbackQueries } = useOptimisticUpdate();

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

      const previousData = updateAllQueries((old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map((order: any) => ({
            ...order,
            items: order.items?.map((item: any) => 
              item.id === itemId 
                ? { 
                    ...item, 
                    preparationStatus: isPrepared ? 'READY' : 'IN_PROGRESS',
                    preparedAt: isPrepared ? new Date().toISOString() : null
                  }
                : item
            )
          }));
      });

      return { previousData };
    },
    
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        rollbackQueries(context.previousData);
      }
      showError(error.response?.data?.message || 'Error al actualizar el item');
    },
    
    onSettled: () => {
      // Invalidar después de un breve retraso para permitir que se vea el cambio
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      }, 100);
    },
  });
}

export function useStartOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();
  const { updateAllQueries, rollbackQueries } = useOptimisticUpdate();

  return useMutation({
    mutationFn: (orderId: string) => kitchenService.startOrderPreparation(orderId),
    
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });

      const previousData = updateAllQueries((old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map((order: any) => 
          order.id === orderId 
            ? { 
                ...order, 
                myScreenStatus: 'IN_PREPARATION',
                preparationStartedAt: new Date().toISOString()
              }
            : order
        );
      });

      return { previousData };
    },
    
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        rollbackQueries(context.previousData);
      }
      showError(error.response?.data?.message || 'Error al iniciar preparación');
    },
    
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      }, 100);
    },
  });
}

export function useCancelOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();
  const { updateAllQueries, rollbackQueries } = useOptimisticUpdate();

  return useMutation({
    mutationFn: (orderId: string) => kitchenService.cancelOrderPreparation(orderId),
    
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });

      const previousData = updateAllQueries((old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map((order: any) => 
          order.id === orderId 
            ? { 
                ...order, 
                myScreenStatus: 'PENDING',
                preparationStartedAt: null,
                items: order.items?.map((item: any) => ({
                  ...item,
                  preparationStatus: item.belongsToMyScreen ? 'IN_PROGRESS' : item.preparationStatus,
                  preparedAt: item.belongsToMyScreen ? null : item.preparedAt
                }))
              }
            : order
        );
      });

      return { previousData };
    },
    
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        rollbackQueries(context.previousData);
      }
      showError(error.response?.data?.message || 'Error al cancelar preparación');
    },
    
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      }, 100);
    },
  });
}

export function useCompleteOrderPreparation() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();
  const { updateAllQueries, rollbackQueries } = useOptimisticUpdate();

  return useMutation({
    mutationFn: (orderId: string) => kitchenService.completeOrderPreparation(orderId),
    
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: [KITCHEN_ORDERS_KEY] });

      const previousData = updateAllQueries((old: any) => {
        if (!old || !Array.isArray(old)) return old;
        
        return old.map((order: any) => 
          order.id === orderId 
            ? { 
                ...order, 
                myScreenStatus: 'READY',
                preparationCompletedAt: new Date().toISOString()
              }
            : order
        );
      });

      return { previousData };
    },
    
    onError: (error: any, variables, context) => {
      if (context?.previousData) {
        rollbackQueries(context.previousData);
      }
      showError(error.response?.data?.message || 'Error al completar preparación');
    },
    
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      }, 100);
    },
  });
}
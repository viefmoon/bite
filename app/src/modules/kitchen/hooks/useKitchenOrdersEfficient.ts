import { useQuery, useMutation } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { KitchenFilters } from '../types/kitchen.types';
import { useGranularKitchenUpdates } from './useGranularKitchenUpdates';

export const KITCHEN_ORDERS_KEY = 'kitchen-orders';

// Query principal - con refetch menos frecuente
export function useKitchenOrders(filters: Partial<KitchenFilters> = {}) {
  return useQuery({
    queryKey: [KITCHEN_ORDERS_KEY, filters],
    queryFn: () => kitchenService.getKitchenOrders(filters),
    refetchInterval: 60000, // Solo cada minuto
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    keepPreviousData: true,
  });
}

// Hooks que NO invalidan toda la query
export function useMarkItemPrepared() {
  const { markItemPrepared } = useGranularKitchenUpdates();

  return useMutation({
    mutationFn: ({
      itemId,
      isPrepared,
    }: {
      itemId: string;
      isPrepared: boolean;
    }) => markItemPrepared(itemId, isPrepared),
  });
}

export function useStartOrderPreparation() {
  const { startOrderPreparation } = useGranularKitchenUpdates();

  return useMutation({
    mutationFn: (orderId: string) => startOrderPreparation(orderId),
  });
}

export function useCancelOrderPreparation() {
  const { cancelOrderPreparation } = useGranularKitchenUpdates();

  return useMutation({
    mutationFn: (orderId: string) => cancelOrderPreparation(orderId),
  });
}

export function useCompleteOrderPreparation() {
  const { completeOrderPreparation } = useGranularKitchenUpdates();

  return useMutation({
    mutationFn: (orderId: string) => completeOrderPreparation(orderId),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { KitchenFilters } from '../types/kitchen.types';
import { useSnackbar } from '@/hooks/useSnackbar';

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
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({
      itemId,
      isPrepared,
    }: {
      itemId: string;
      isPrepared: boolean;
    }) => kitchenService.markItemPrepared(itemId, isPrepared),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      showSnackbar('Item actualizado correctamente', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.response?.data?.message || 'Error al actualizar el item',
        'error',
      );
    },
  });
}

export function useStartOrderPreparation() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.startOrderPreparation(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      showSnackbar('Orden en preparación', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.response?.data?.message || 'Error al iniciar preparación',
        'error',
      );
    },
  });
}

export function useCancelOrderPreparation() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.cancelOrderPreparation(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      showSnackbar('Preparación cancelada', 'info');
    },
    onError: (error: any) => {
      showSnackbar(
        error.response?.data?.message || 'Error al cancelar preparación',
        'error',
      );
    },
  });
}

export function useCompleteOrderPreparation() {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (orderId: string) =>
      kitchenService.completeOrderPreparation(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KITCHEN_ORDERS_KEY] });
      showSnackbar('Orden lista', 'success');
    },
    onError: (error: any) => {
      showSnackbar(
        error.response?.data?.message || 'Error al completar preparación',
        'error',
      );
    },
  });
}

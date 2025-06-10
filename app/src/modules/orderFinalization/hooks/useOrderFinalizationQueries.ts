import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderFinalizationService } from '../services/orderFinalizationService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { FinalizeOrdersPayload } from '../types/orderFinalization.types';

export const useOrdersForFinalization = () => {
  return useQuery({
    queryKey: ['orders', 'for-finalization'],
    queryFn: orderFinalizationService.getOrdersForFinalization,
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });
};

export const useOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => orderFinalizationService.getOrderDetail(orderId),
    enabled: !!orderId,
  });
};

export const useFinalizeOrders = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (payload: FinalizeOrdersPayload) => 
      orderFinalizationService.finalizeOrders(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showSnackbar('Órdenes finalizadas exitosamente', 'success');
    },
    onError: () => {
      showSnackbar('Error al finalizar las órdenes', 'error');
    },
  });
};
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderFinalizationService } from '../services/orderFinalizationService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { FinalizeOrdersPayload } from '../types/orderFinalization.types';

export const useOrdersForFinalizationList = () => {
  return useQuery({
    queryKey: ['orders', 'for-finalization-list'],
    queryFn: orderFinalizationService.getOrdersForFinalizationList,
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000,
    keepPreviousData: true,
    notifyOnChangeProps: ['data', 'error'],
  });
};

export const useOrderForFinalizationDetail = (orderId: string | null) => {
  return useQuery({
    queryKey: ['orders', 'for-finalization-detail', orderId],
    queryFn: () => orderId ? orderFinalizationService.getOrderForFinalizationDetail(orderId) : null,
    enabled: !!orderId,
    staleTime: 30000,
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

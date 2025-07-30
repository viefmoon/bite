import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/app/services/orderService';
import { ORDER_FILTER_PRESETS } from '@/app/types/order-filters.types';

export const useOrdersForFinalizationList = () => {
  return useQuery({
    queryKey: ['orders', 'for-finalization-list'],
    queryFn: () =>
      orderService.getOrders(ORDER_FILTER_PRESETS.forFinalization()),
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000,
    placeholderData: (previousData) => previousData,
    notifyOnChangeProps: ['data', 'error'],
  });
};

export const useOrderForFinalizationDetail = (orderId: string | null) => {
  return useQuery({
    queryKey: ['orders', 'for-finalization-detail', orderId],
    queryFn: () => (orderId ? orderService.getOrderById(orderId) : null),
    enabled: !!orderId,
    staleTime: 0, // Siempre refetch cuando se abre el modal
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

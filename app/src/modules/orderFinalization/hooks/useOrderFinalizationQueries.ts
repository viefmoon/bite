import { useQuery } from '@tanstack/react-query';
import { orderFinalizationService } from '../services/orderFinalizationService';

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
    queryFn: () =>
      orderId
        ? orderFinalizationService.getOrderForFinalizationDetail(orderId)
        : null,
    enabled: !!orderId,
    staleTime: 30000,
  });
};

import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/app/services/orderService';
import { ORDER_FILTER_PRESETS } from '@/app/types/order-filters.types';
import type { Order } from '@/app/schemas/domain/order.schema';

export const useShiftOrders = (shiftId: string | undefined) => {
  return useQuery<Order[], Error>({
    queryKey: ['shifts', shiftId, 'orders'],
    queryFn: () =>
      shiftId
        ? orderService.getOrders(ORDER_FILTER_PRESETS.byShift(shiftId))
        : Promise.resolve([]),
    enabled: !!shiftId,
    staleTime: 300000, // 5 minutos
  });
};

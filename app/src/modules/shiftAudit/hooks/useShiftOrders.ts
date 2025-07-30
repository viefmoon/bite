import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/app/services/shifts';
import type { Order } from '@/app/schemas/domain/order.schema';

export const useShiftOrders = (shiftId: string | undefined) => {
  return useQuery<Order[], Error>({
    queryKey: ['shifts', shiftId, 'orders'],
    queryFn: () => shiftsService.getOrdersByShift(shiftId!),
    enabled: !!shiftId,
    staleTime: 300000, // 5 minutos
  });
};

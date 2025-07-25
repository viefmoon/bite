import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts';
import type { Order } from '@/app/schemas/domain/order.schema';
import type { Shift, ShiftSummary } from '../types';

export const useShiftOrders = (shiftId: string | undefined) => {
  return useQuery<Order[], Error>({
    queryKey: ['shifts', shiftId, 'orders'],
    queryFn: () => shiftsService.getOrdersByShift(shiftId!),
    enabled: !!shiftId,
    staleTime: 300000, // 5 minutos
  });
};

export const useShiftSummary = (shiftId: string | undefined) => {
  const shiftQuery = useQuery<Shift, Error>({
    queryKey: ['shifts', shiftId],
    queryFn: () => shiftsService.getById(shiftId!),
    enabled: !!shiftId,
  });

  const ordersQuery = useQuery<Order[], Error>({
    queryKey: ['shifts', shiftId, 'orders'],
    queryFn: () => shiftsService.getOrdersByShift(shiftId!),
    enabled: !!shiftId && shiftQuery.isSuccess,
  });

  const summary: ShiftSummary | undefined =
    shiftQuery.data && ordersQuery.data
      ? shiftsService.calculateShiftSummary(shiftQuery.data, ordersQuery.data)
      : undefined;

  return {
    summary,
    isLoading: shiftQuery.isLoading || ordersQuery.isLoading,
    error: shiftQuery.error || ordersQuery.error,
  };
};

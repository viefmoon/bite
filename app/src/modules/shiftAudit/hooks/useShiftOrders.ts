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
    queryFn: async () => {
      const data = await shiftsService.getById(shiftId!);
      return {
        ...data,
        status:
          data.status === 'OPEN' ? ('open' as const) : ('closed' as const),
        openedBy: data.openedBy || {
          id: '',
          firstName: '',
          lastName: '',
          email: '',
        },
        closedBy: data.closedBy,
        createdAt: data.openedAt,
        updatedAt: data.closedAt || data.openedAt,
      };
    },
    enabled: !!shiftId,
  });

  const ordersQuery = useQuery<Order[], Error>({
    queryKey: ['shifts', shiftId, 'orders'],
    queryFn: () => shiftsService.getOrdersByShift(shiftId!),
    enabled: !!shiftId && shiftQuery.isSuccess,
  });

  const summary: ShiftSummary | undefined =
    shiftQuery.data && ordersQuery.data
      ? shiftsService.calculateShiftSummary(
          // Convertir de vuelta al tipo del servicio para calculateShiftSummary
          {
            ...shiftQuery.data,
            status: shiftQuery.data.status === 'open' ? 'OPEN' : 'CLOSED',
          } as any,
          ordersQuery.data,
        )
      : undefined;

  return {
    summary,
    isLoading: shiftQuery.isLoading || ordersQuery.isLoading,
    error: shiftQuery.error || ordersQuery.error,
  };
};

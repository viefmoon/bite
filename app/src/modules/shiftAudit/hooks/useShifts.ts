import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/app/services/shifts';
import type { Shift } from '@/app/schemas/domain/shift.schema';

// Tipo para los shifts transformados manteniendo el status original
type TransformedShift = Shift;

export const useShifts = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<TransformedShift[], Error>({
    queryKey: ['shifts', 'history', params],
    queryFn: async () => {
      const data = await shiftsService.getHistory(params);
      return data.map((shift) => ({
        ...shift,
        openedBy: shift.openedBy || {
          id: '',
          firstName: '',
          lastName: '',
          email: '',
        },
        closedBy: shift.closedBy,
        createdAt: shift.openedAt,
        updatedAt: shift.closedAt || shift.openedAt,
      }));
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

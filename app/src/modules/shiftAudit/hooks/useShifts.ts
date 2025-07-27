import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts';
import type { Shift } from '../types';

export const useShifts = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<Shift[], Error>({
    queryKey: ['shifts', 'history', params],
    queryFn: async () => {
      const data = await shiftsService.getHistory(params);
      return data.map((shift) => ({
        ...shift,
        status:
          shift.status === 'OPEN' ? ('open' as const) : ('closed' as const),
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

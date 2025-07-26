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

export const useCurrentShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['shifts', 'current'],
    queryFn: async () => {
      const data = await shiftsService.getCurrentShift();
      if (!data) return null;
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
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useShiftDetail = (shiftId: string | undefined) => {
  return useQuery<Shift, Error>({
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
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

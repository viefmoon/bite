import { useQuery } from '@tanstack/react-query';
import { shiftsService, type Shift } from '@/services/shifts';

export const useShifts = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<Shift[], Error>({
    queryKey: ['shifts', 'history', params],
    queryFn: () => shiftsService.getHistory(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useCurrentShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['shifts', 'current'],
    queryFn: () => shiftsService.getCurrentShift(),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useShiftDetail = (shiftId: string | undefined) => {
  return useQuery<Shift, Error>({
    queryKey: ['shifts', shiftId],
    queryFn: () => shiftsService.getById(shiftId!),
    enabled: !!shiftId,
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

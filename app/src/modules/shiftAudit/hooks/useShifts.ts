import { useQuery } from '@tanstack/react-query';
import { shiftService } from '../services/shiftService';
import type { Shift } from '../types';

export const useShifts = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery<Shift[], Error>({
    queryKey: ['shifts', 'history', params],
    queryFn: () => shiftService.getHistory(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useCurrentShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['shifts', 'current'],
    queryFn: () => shiftService.getCurrentShift(),
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

export const useShiftDetail = (shiftId: string | undefined) => {
  return useQuery<Shift, Error>({
    queryKey: ['shifts', shiftId],
    queryFn: () => shiftService.getShiftById(shiftId!),
    enabled: !!shiftId,
    staleTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

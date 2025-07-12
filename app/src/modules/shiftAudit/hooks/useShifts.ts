import { useQuery } from '@tanstack/react-query';
import { shiftService } from '../services/shiftService';
import type { Shift } from '../types';

export const useShifts = (limit = 30, offset = 0) => {
  return useQuery<Shift[], Error>({
    queryKey: ['shifts', 'history', limit, offset],
    queryFn: () => shiftService.getHistory({ limit, offset }),
    staleTime: 60000, // 1 minuto
  });
};

export const useCurrentShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['shifts', 'current'],
    queryFn: () => shiftService.getCurrentShift(),
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refrescar cada minuto
  });
};

export const useShiftDetail = (shiftId: string | undefined) => {
  return useQuery<Shift, Error>({
    queryKey: ['shifts', shiftId],
    queryFn: () => shiftService.getShiftById(shiftId!),
    enabled: !!shiftId,
    staleTime: 300000, // 5 minutos
  });
};

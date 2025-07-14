import { useQuery } from '@tanstack/react-query';
import { shiftsService, type Shift } from '@/services/shifts';

export const useGlobalShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['global', 'shift', 'current'],
    queryFn: () => shiftsService.getCurrentShift(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });
};

export const invalidateShiftCache = async (queryClient: any) => {
  await queryClient.invalidateQueries(['global', 'shift', 'current']);
};
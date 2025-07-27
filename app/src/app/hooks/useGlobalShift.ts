import { useQuery } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts';
import type { Shift } from '@/app/schemas/domain/shift.schema';

export const useGlobalShift = () => {
  return useQuery<Shift | null, Error>({
    queryKey: ['global', 'shift', 'current'],
    queryFn: () => shiftsService.getCurrentShift(),
    staleTime: 60 * 1000, // Los datos se consideran obsoletos después de 60 segundos
    gcTime: 5 * 60 * 1000, // Mantener en caché por 5 minutos
    refetchInterval: 2 * 60 * 1000, // Actualizar cada 2 minutos automáticamente
    refetchOnWindowFocus: false, // No actualizar automáticamente al volver al foco
    refetchOnMount: 'always', // Actualizar siempre al montar el componente
    refetchOnReconnect: true, // Actualizar cuando se reconecta
    retry: 1, // Solo reintentar una vez en caso de error
    retryDelay: 1000, // Esperar 1 segundo antes de reintentar
  });
};

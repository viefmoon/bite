import { useQuery } from '@tanstack/react-query';
// Importar desde el servicio de categorías correcto
import { getFullMenu } from '@/modules/menu/services/categoryService';
// Importar el tipo de menú completo con relaciones anidadas
import type { FullMenuCategory } from '@/modules/orders/types/orders.types';
import { ApiError } from '@/app/lib/errors';

// Define una clave única para esta query
const queryKey = ['fullMenu'];

/**
 * Hook personalizado para obtener el menú completo usando React Query.
 * Gestiona el fetching, caching, estado de carga y errores.
 * Incluye polling para mantener precios y disponibilidad actualizados.
 */
export function useGetFullMenu() {
  return useQuery<FullMenuCategory[], ApiError>({
    queryKey: queryKey,
    queryFn: getFullMenu,
    refetchInterval: 10000, // Actualizar cada 10 segundos
    refetchIntervalInBackground: false, // No actualizar cuando la app está en background
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5000, // Los datos se consideran frescos por 5 segundos
    // IMPORTANTE: Mantener datos previos durante refetch para evitar parpadeos
    keepPreviousData: true,
    // No mostrar loading en refetch para mantener la UI estable
    notifyOnChangeProps: ['data', 'error'],
  });
}

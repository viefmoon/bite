import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
// Importar desde el servicio de categorías
import { getOrderMenu } from '@/modules/menu/services/categoryService';
// Importar el tipo de menú completo con relaciones anidadas
import type { FullMenuCategory } from '@/modules/orders/schema/orders.schema';
import { ApiError } from '@/app/lib/errors';
import { prefetchMenuImages } from '@/app/lib/imageCache';

// Define clave única para la query
const orderMenuQueryKey = ['orderMenu'];

/**
 * Hook para obtener el menú en pantallas de creación y edición de órdenes.
 * Devuelve solo los campos necesarios para mejorar el rendimiento.
 */
export function useGetOrderMenu() {
  const query = useQuery<FullMenuCategory[], ApiError>({
    queryKey: orderMenuQueryKey,
    queryFn: getOrderMenu,
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

  // Prefetch de imágenes cuando se cargan los datos del menú
  useEffect(() => {
    if (query.data && query.data.length > 0) {
      // Prefetch en background sin bloquear la UI
      prefetchMenuImages(query.data, {
        maxConcurrent: 3, // Limitar concurrencia para no saturar la red
      }).catch(() => {
        // Silenciar errores de prefetch para no afectar la UX
      });
    }
  }, [query.data]);

  return query;
}

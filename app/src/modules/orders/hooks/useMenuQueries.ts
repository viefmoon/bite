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
 */
export function useGetFullMenu() {
  return useQuery<FullMenuCategory[], ApiError>({
    queryKey: queryKey,
    queryFn: getFullMenu,
    // Sin configuración adicional, se usará la configuración global
  });
}
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook que refresca todas las queries de un módulo cuando la pantalla recibe foco
 * @param modulePrefix - Prefijo del módulo (ej: 'products', 'orders', etc)
 */
export function useRefreshModuleOnFocus(
  modulePrefix: string,
  options?: {
    enabled?: boolean;
  },
) {
  const queryClient = useQueryClient();
  const { enabled = true } = options || {};

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      // Invalidar todas las queries que empiecen con el prefijo del módulo
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          if (Array.isArray(queryKey) && queryKey.length > 0) {
            return queryKey[0] === modulePrefix;
          }
          return false;
        },
      });
    }, [enabled, modulePrefix, queryClient]),
  );
}

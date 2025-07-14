import { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook que refresca las queries especificadas cuando la pantalla recibe el foco
 * @param queryKeys - Array de query keys a invalidar cuando la pantalla reciba foco
 * @param options - Opciones adicionales
 */
export function useRefreshOnFocus(
  queryKeys: (string | readonly unknown[])[],
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
  },
) {
  const queryClient = useQueryClient();
  const { enabled = true, refetchOnMount = true } = options || {};

  // Invalidar queries cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;

      // Invalidar todas las queries especificadas
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        });
      });
    }, [enabled, queryKeys, queryClient]),
  );

  // También invalidar al montar si está habilitado
  useEffect(() => {
    if (!enabled || !refetchOnMount) return;

    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      });
    });
  }, [enabled, refetchOnMount, queryKeys, queryClient]);

  return {
    refetch: () => {
      queryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        });
      });
    },
  };
}

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

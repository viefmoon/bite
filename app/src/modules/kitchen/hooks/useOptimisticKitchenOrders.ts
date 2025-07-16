import { useQueryClient } from '@tanstack/react-query';

export const KITCHEN_ORDERS_KEY = 'kitchen-orders';

export function useOptimisticUpdate() {
  const queryClient = useQueryClient();

  const updateAllQueries = (updateFn: (oldData: any) => any) => {
    // Obtener TODAS las queries del cache
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const previousData: any[] = [];
    
    // Filtrar y actualizar queries de kitchen orders
    queries.forEach((query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === KITCHEN_ORDERS_KEY) {
        const oldData = query.state.data;
        if (oldData) {
          previousData.push([queryKey, oldData]);
          const newData = updateFn(oldData);
          queryClient.setQueryData(queryKey, newData);
        }
      }
    });
    
    return previousData;
  };

  const rollbackQueries = (previousData: any[]) => {
    previousData.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
  };

  return { updateAllQueries, rollbackQueries };
}
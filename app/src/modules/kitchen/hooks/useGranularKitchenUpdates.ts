import { useQueryClient } from '@tanstack/react-query';
import { kitchenService } from '../services/kitchenService';
import { useKitchenSnackbar } from './useKitchenSnackbar';
import { KITCHEN_ORDERS_KEY } from './useKitchenOrdersOptimistic';

export function useGranularKitchenUpdates() {
  const queryClient = useQueryClient();
  const { showError } = useKitchenSnackbar();

  // Actualizar solo un item específico sin invalidar toda la query
  const updateItemOptimistically = (itemId: string, isPrepared: boolean) => {
    let updated = false;

    // Obtener todas las queries de kitchen
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    queries.forEach((query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === KITCHEN_ORDERS_KEY) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Solo actualizar el array si contiene el item
          return oldData.map((order) => {
            const hasItem = order.items?.some(
              (item: any) => item.id === itemId,
            );
            if (!hasItem) return order; // No modificar órdenes que no tienen el item

            updated = true;
            return {
              ...order,
              items: order.items.map((item: any) =>
                item.id === itemId
                  ? {
                      ...item,
                      preparationStatus: isPrepared ? 'READY' : 'IN_PROGRESS',
                      preparedAt: isPrepared ? new Date().toISOString() : null,
                    }
                  : item,
              ),
            };
          });
        });
      }
    });

    return updated;
  };

  // Actualizar solo el estado de una orden específica
  const updateOrderStatusOptimistically = (orderId: string, status: string) => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    queries.forEach((query) => {
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === KITCHEN_ORDERS_KEY) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData;

          // Solo actualizar la orden específica
          return oldData.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  myScreenStatus: status,
                  preparationStartedAt:
                    status === 'IN_PREPARATION'
                      ? new Date().toISOString()
                      : order.preparationStartedAt,
                  preparationCompletedAt:
                    status === 'READY'
                      ? new Date().toISOString()
                      : order.preparationCompletedAt,
                  // Si se cancela, resetear items
                  items:
                    status === 'PENDING'
                      ? order.items?.map((item: any) => ({
                          ...item,
                          preparationStatus: item.belongsToMyScreen
                            ? 'IN_PROGRESS'
                            : item.preparationStatus,
                          preparedAt: item.belongsToMyScreen
                            ? null
                            : item.preparedAt,
                        }))
                      : order.items,
                }
              : order,
          );
        });
      }
    });
  };

  // Hook para marcar item como preparado SIN invalidar toda la query
  const markItemPrepared = async (itemId: string, isPrepared: boolean) => {
    try {
      // 1. Actualización optimista granular
      const wasUpdated = updateItemOptimistically(itemId, isPrepared);

      if (!wasUpdated) {
        console.warn('Item not found in cache:', itemId);
      }

      // 2. Llamar al servidor
      await kitchenService.markItemPrepared(itemId, isPrepared);

      // 3. NO invalidar toda la query - el cambio ya está aplicado
      // Solo sincronizar después de varios segundos para capturar otros cambios
    } catch (error: any) {
      // 4. En caso de error, revertir solo ese item
      updateItemOptimistically(itemId, !isPrepared);
      showError(error.response?.data?.message || 'Error al actualizar el item');
    }
  };

  // Hooks para cambios de estado de orden
  const startOrderPreparation = async (orderId: string) => {
    try {
      updateOrderStatusOptimistically(orderId, 'IN_PREPARATION');
      await kitchenService.startOrderPreparation(orderId);
    } catch (error: any) {
      updateOrderStatusOptimistically(orderId, 'PENDING');
      showError(
        error.response?.data?.message || 'Error al iniciar preparación',
      );
    }
  };

  const cancelOrderPreparation = async (orderId: string) => {
    try {
      updateOrderStatusOptimistically(orderId, 'PENDING');
      await kitchenService.cancelOrderPreparation(orderId);
    } catch (error: any) {
      // Revertir - volver a IN_PREPARATION
      updateOrderStatusOptimistically(orderId, 'IN_PREPARATION');
      showError(
        error.response?.data?.message || 'Error al cancelar preparación',
      );
    }
  };

  const completeOrderPreparation = async (orderId: string) => {
    try {
      updateOrderStatusOptimistically(orderId, 'READY');
      await kitchenService.completeOrderPreparation(orderId);
    } catch (error: any) {
      updateOrderStatusOptimistically(orderId, 'IN_PREPARATION');
      showError(
        error.response?.data?.message || 'Error al completar preparación',
      );
    }
  };

  return {
    markItemPrepared,
    startOrderPreparation,
    cancelOrderPreparation,
    completeOrderPreparation,
  };
}

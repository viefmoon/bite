import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { adjustmentService } from '../services/adjustmentService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type { OrderAdjustmentDto } from '../types/update-order.types';

export const useCreateBulkAdjustmentsMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (adjustments: OrderAdjustmentDto[]) =>
      adjustmentService.createBulkAdjustments(adjustments),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      if (variables.length > 0 && variables[0].orderId) {
        queryClient.invalidateQueries({
          queryKey: ['orders', variables[0].orderId],
        });
        queryClient.invalidateQueries({
          queryKey: ['adjustments', 'order', variables[0].orderId],
        });
      }
      showSnackbar({
        message: 'Ajustes aplicados correctamente',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showSnackbar({
        message: error.message || 'Error al aplicar ajustes',
        type: 'error',
      });
    },
  });
};

export const useOrderAdjustmentsQuery = (orderId: string, enabled = true) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useQuery({
    queryKey: ['adjustments', 'order', orderId],
    queryFn: () => adjustmentService.getOrderAdjustments(orderId),
    enabled: enabled && !!orderId,
    onError: (error: Error) => {
      showSnackbar({
        message: error.message || 'Error al cargar ajustes',
        type: 'error',
      });
    },
  });
};

export const useDeleteAdjustmentMutation = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (adjustmentId: string) =>
      adjustmentService.deleteAdjustment(adjustmentId),
    onSuccess: () => {
      // Invalidar todas las queries de ajustes
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showSnackbar({
        message: 'Ajuste eliminado correctamente',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showSnackbar({
        message: error.message || 'Error al eliminar ajuste',
        type: 'error',
      });
    },
  });
};
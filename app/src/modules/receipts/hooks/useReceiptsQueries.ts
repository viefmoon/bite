import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  receiptService,
  receiptQueryOptions,
} from '../services/receiptService';
import { useSnackbarStore } from '@/app/store/snackbarStore';

export const useReceipts = (filters?: {
  startDate?: string;
  endDate?: string;
  orderType?: string;
}) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const query = useQuery({
    ...receiptQueryOptions.receipts(filters || {}),
  });

  // Manejar errores
  if (query.error) {
    showSnackbar({
      message: query.error.message || 'Error al cargar los recibos',
      type: 'error',
    });
  }

  return query;
};

export const useReceipt = (id: string) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const query = useQuery({
    ...receiptQueryOptions.receipt(id),
  });

  // Manejar errores
  if (query.error) {
    showSnackbar({
      message: query.error.message || 'Error al cargar el recibo',
      type: 'error',
    });
  }

  return query;
};

export const useRecoverOrder = () => {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  return useMutation({
    mutationFn: (orderId: string) => receiptService.recoverOrder(orderId),
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      showSnackbar({
        message: 'Orden recuperada exitosamente',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      showSnackbar({
        message: error.message || 'Error al recuperar la orden',
        type: 'error',
      });
    },
  });
};

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  receiptService,
  receiptQueryOptions,
} from '../services/receiptService';
import { useSnackbarStore } from '@/app/store/snackbarStore';

export const useReceiptsInfinite = (filters?: {
  status?: 'COMPLETED' | 'CANCELLED';
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const query = useInfiniteQuery({
    ...receiptQueryOptions.receiptsInfinite(filters || {}),
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

export const useReceiptsCount = (filters?: {
  status?: 'COMPLETED' | 'CANCELLED';
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  return useQuery({
    queryKey: ['receipts', 'count', filters],
    queryFn: async () => {
      const response = await receiptService.getReceipts({
        ...filters,
        page: 1,
        limit: 20, // Usar un límite más alto para obtener un conteo más preciso
      });
      return response.totalData;
    },
  });
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

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { orderService } from '@/app/services/orderService';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { ORDER_FILTER_PRESETS } from '@/app/types/order-filters.types';

import type { ReceiptFilters } from '../schema/receipt.schema';

export const useReceipts = (filters?: ReceiptFilters) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const query = useQuery({
    queryKey: ['receipts', filters],
    queryFn: () =>
      orderService.getOrders(ORDER_FILTER_PRESETS.receipts(filters)),
  });

  // Usar useEffect para manejar errores y evitar llamadas durante el render
  useEffect(() => {
    if (query.error) {
      showSnackbar({
        message: query.error.message || 'Error al cargar los recibos',
        type: 'error',
      });
    }
  }, [query.error, showSnackbar]);

  return query;
};

export const useRecoverOrder = () => {
  return useApiMutation(
    (orderId: string) => orderService.recoverOrder(orderId),
    {
      successMessage: 'Orden recuperada exitosamente',
      invalidateQueryKeys: [['receipts'], ['orders']],
    },
  );
};

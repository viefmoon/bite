import { useQuery } from '@tanstack/react-query';
import {
  receiptService,
  receiptQueryOptions,
} from '../services/receiptService';
import { useApiMutation } from '@/app/hooks/useApiMutation';
import { useSnackbarStore } from '@/app/store/snackbarStore';

import type {
  ReceiptFilters,
  ReceiptsListResponse,
  Receipt,
} from '../schema/receipt.schema';

export const useReceipts = (filters?: ReceiptFilters) => {
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const query = useQuery<ReceiptsListResponse, Error>({
    ...receiptQueryOptions.receipts(filters || {}),
  });

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

  const query = useQuery<Receipt, Error>({
    ...receiptQueryOptions.receipt(id),
  });

  if (query.error) {
    showSnackbar({
      message: query.error.message || 'Error al cargar el recibo',
      type: 'error',
    });
  }

  return query;
};

export const useRecoverOrder = () => {
  return useApiMutation(
    (orderId: string) => receiptService.recoverOrder(orderId),
    {
      successMessage: 'Orden recuperada exitosamente',
      invalidateQueryKeys: [['receipts'], ['orders']],
    },
  );
};

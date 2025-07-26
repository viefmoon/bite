import apiClient from '@/app/services/apiClient';
import type { QueryOptions } from '@tanstack/react-query';
import { API_PATHS } from '@/app/constants/apiPaths';
import type {
  Receipt,
  ReceiptsListResponse,
  ReceiptFilters,
} from '../schema/receipt.schema';
import {
  receiptsListResponseSchema,
  receiptSchema,
} from '../schema/receipt.schema';
import type { Order } from '@/modules/orders/schema/orders.schema';

export const receiptService = {
  getReceiptsList: async (
    params: ReceiptFilters = {},
  ): Promise<ReceiptsListResponse> => {
    const { startDate, endDate, orderType } = params;

    const queryParams: Record<string, any> = {};

    if (startDate) {
      queryParams.startDate = startDate;
    }
    if (endDate) {
      queryParams.endDate = endDate;
    }
    if (orderType) {
      queryParams.orderType = orderType;
    }

    const response = await apiClient.get(API_PATHS.ORDERS_RECEIPTS_LIST, {
      params: queryParams,
    });

    return receiptsListResponseSchema.parse(response.data);
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const response = await apiClient.get(
      API_PATHS.ORDERS_RECEIPTS_BY_ID.replace(':id', id),
    );

    return receiptSchema.parse(response.data);
  },

  recoverOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      API_PATHS.ORDERS_RECOVER.replace(':id', id),
      {},
    );

    return response.data;
  },
};

export const receiptQueryOptions = {
  receipts: (
    params: ReceiptFilters = {},
  ): QueryOptions<ReceiptsListResponse, Error> => ({
    queryKey: ['receipts', params],
    queryFn: () => receiptService.getReceiptsList(params),
  }),

  receipt: (id: string): QueryOptions<Receipt, Error> => ({
    queryKey: ['receipt', id],
    queryFn: () => receiptService.getReceiptById(id),
  }),
};

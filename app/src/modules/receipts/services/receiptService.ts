import apiClient from '@/app/services/apiClient';
import type { QueryOptions } from '@tanstack/react-query';
import { API_PATHS } from '@/app/constants/apiPaths';
import { ApiError } from '@/app/lib/errors';
import type { Receipt, ReceiptList, ReceiptsListResponse, ReceiptFilters } from '../types/receipt.types';
import type { Order } from '@/modules/orders/types/orders.types';

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

    const response = await apiClient.get<ReceiptsListResponse>(
      `${API_PATHS.ORDERS}/receipts-list`,
      queryParams
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },

  getReceiptById: async (id: string): Promise<Receipt> => {
    const response = await apiClient.get<Receipt>(`${API_PATHS.ORDERS}/receipts/${id}`);

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },

  recoverOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      `${API_PATHS.ORDERS}/${id}/recover`,
      {},
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },
};

export const receiptQueryOptions = {
  receipts: (
    params: ReceiptFilters = {},
  ): QueryOptions<ReceiptsListResponse, Error> => ({
    queryKey: ['receipts', params],
    queryFn: () => receiptService.getReceiptsList(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  }),

  receipt: (id: string): QueryOptions<Receipt, Error> => ({
    queryKey: ['receipt', id],
    queryFn: () => receiptService.getReceiptById(id),
  }),
};

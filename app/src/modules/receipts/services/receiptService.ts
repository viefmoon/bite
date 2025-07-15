import apiClient from '@/app/services/apiClient';
import type { QueryOptions } from '@tanstack/react-query';
import { API_PATHS } from '@/app/constants/apiPaths';
import { ApiError } from '@/app/lib/errors';
import type { Receipt, ReceiptList, ReceiptsListResponse, ReceiptFilters } from '../types/receipt.types';
import type { Order } from '@/modules/orders/types/orders.types';

export const receiptService = {
  // Obtener lista optimizada de recibos del turno actual
  getReceiptsList: async (
    params: ReceiptFilters = {},
  ): Promise<ReceiptsListResponse> => {
    const { startDate, endDate, orderType } = params;

    const queryParams: Record<string, any> = {};

    // Agregar filtros opcionales
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
      console.error(
        '[receiptService.getReceipts] Failed to fetch receipts:',
        response,
      );
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    // El nuevo endpoint devuelve un array directo
    return response.data;
  },

  // Obtener detalles de un recibo específico
  getReceiptById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`${API_PATHS.ORDERS}/${id}`);

    if (!response.ok || !response.data) {
      console.error(
        '[receiptService.getReceiptById] Failed to fetch receipt:',
        response,
      );
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },

  // Recuperar una orden completada o cancelada
  recoverOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.post<Order>(
      `${API_PATHS.ORDERS}/${id}/recover`,
      {}, // Body vacío ya que no necesitamos parámetros
    );

    if (!response.ok || !response.data) {
      console.error(
        '[receiptService.recoverOrder] Failed to recover order:',
        response,
      );
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    return response.data;
  },
};

// Query options para React Query
export const receiptQueryOptions = {
  receipts: (
    params: ReceiptFilters = {},
  ): QueryOptions<ReceiptsListResponse, Error> => ({
    queryKey: ['receipts', params],
    queryFn: () => receiptService.getReceiptsList(params),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  }),

  receipt: (id: string): QueryOptions<Order, Error> => ({
    queryKey: ['receipt', id],
    queryFn: () => receiptService.getReceiptById(id),
  }),
};

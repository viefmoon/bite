import apiClient from '@/app/services/apiClient';
import type { Order } from '@/modules/orders/types/orders.types';
import type { QueryOptions } from '@tanstack/react-query';
import { infiniteQueryOptions } from '@tanstack/react-query';
import { API_PATHS } from '@/app/constants/apiPaths';
import { ApiError } from '@/app/lib/errors';

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  totalData: number;
  page: number;
  limit: number;
}

interface GetReceiptsParams {
  page?: number;
  limit?: number;
  status?: 'COMPLETED' | 'CANCELLED';
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Ya no necesitamos parámetros para recuperar la orden

export const receiptService = {
  // Obtener órdenes finalizadas o canceladas
  getReceipts: async (
    params: GetReceiptsParams,
  ): Promise<PaginatedResponse<Order>> => {
    const { page = 1, limit = 20, status, startDate, endDate, search } = params;

    const queryParams: Record<string, any> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    // Si hay un estado específico, usarlo. Si no, obtener ambos estados
    if (status) {
      queryParams.orderStatus = status;
    } else {
      // Por defecto mostrar órdenes completadas y canceladas usando el nuevo parámetro orderStatuses
      queryParams.orderStatuses = ['COMPLETED', 'CANCELLED'];
    }

    // Agregar filtros de fecha si se proporcionan
    if (startDate) {
      queryParams.startDate = startDate.toISOString();
    }
    if (endDate) {
      queryParams.endDate = endDate.toISOString();
    }

    const response = await apiClient.get<any>(API_PATHS.ORDERS, queryParams);

    if (!response.ok || !response.data) {
      console.error(
        '[receiptService.getReceipts] Failed to fetch receipts:',
        response,
      );
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    let data: Order[] = [];
    let total = 0;
    let totalPages = 1;

    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response.data) && response.data.length === 2) {
      // Formato antiguo: [data, totalCount]
      [data, total] = response.data;
      totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      // Nuevo formato: { data: [], hasNextPage: boolean }
      data = response.data.data;
      total = data.length; // No tenemos el total real, usar la longitud
      // Si hay más páginas, estimar que hay al menos una página más
      totalPages = response.data.hasNextPage ? page + 1 : page;

      // Si estamos en la primera página y no hay siguiente, entonces solo hay una página
      if (page === 1 && !response.data.hasNextPage) {
        totalPages = 1;
      }
    } else {
      console.error(
        '[receiptService.getReceipts] Unexpected response format:',
        response.data,
      );
      throw new Error('Formato de respuesta inesperado del servidor');
    }

    // Debug: ver qué órdenes están llegando
    console.log(
      '[receiptService] Órdenes recibidas del backend:',
      data.map((o) => ({
        id: o.id,
        orderStatus: o.orderStatus,
        shiftOrderNumber: o.shiftOrderNumber,
      })),
    );

    // Filtrar para asegurar que solo se muestren COMPLETED y CANCELLED
    let filteredData = data.filter(
      (order) =>
        order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED',
    );

    // Si hay búsqueda, filtrar adicionalmente del lado del cliente
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((order) => {
        // Buscar por número de orden
        if (
          order.orderNumber?.toString().includes(searchLower) ||
          order.shiftOrderNumber?.toString().includes(searchLower)
        ) {
          return true;
        }

        // Buscar en deliveryInfo (nombre, teléfono, dirección)
        if (order.deliveryInfo) {
          const { recipientName, recipientPhone, fullAddress } =
            order.deliveryInfo;

          if (recipientName?.toLowerCase().includes(searchLower)) {
            return true;
          }

          if (recipientPhone?.includes(search)) {
            // Para teléfono usar búsqueda exacta
            return true;
          }

          if (fullAddress?.toLowerCase().includes(searchLower)) {
            return true;
          }
        }

        // Buscar en notas de la orden
        if (order.notes?.toLowerCase().includes(searchLower)) {
          return true;
        }

        return false;
      });
    }

    // Si estamos filtrando del lado del cliente, actualizar el total
    const actualTotal = filteredData.length;

    return {
      data: filteredData,
      totalPages,
      totalData: actualTotal, // Usar el total real después del filtrado
      page,
      limit,
    };
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
  receiptsInfinite: (filters?: Omit<GetReceiptsParams, 'page'>) =>
    infiniteQueryOptions({
      queryKey: ['receipts', 'infinite', filters],
      queryFn: ({ pageParam = 1 }) =>
        receiptService.getReceipts({
          ...filters,
          page: pageParam,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }),

  receipts: (
    params: GetReceiptsParams,
  ): QueryOptions<PaginatedResponse<Order>, Error> => ({
    queryKey: ['receipts', params],
    queryFn: () => receiptService.getReceipts(params),
  }),

  receipt: (id: string): QueryOptions<Order, Error> => ({
    queryKey: ['receipt', id],
    queryFn: () => receiptService.getReceiptById(id),
  }),
};

import apiClient from '@/app/services/apiClient';
import { handleApiResponse } from '@/app/lib/apiHelpers';
import { API_PATHS } from '@/app/constants/apiPaths';
import { ApiError } from '@/app/lib/errors';
import type { Order } from '../../../app/schemas/domain/order.schema';
import type { FindAllOrdersDto, OrderOpenList } from '../types/orders.types';
import type { PaginatedResponse } from '../../../app/types/api.types';
import type { OrderDetailsForBackend } from '../components/OrderCartDetail';
import type { UpdateOrderPayload } from '../types/update-order.types';

const createOrder = async (
  orderData: OrderDetailsForBackend,
): Promise<Order> => {
  const response = await apiClient.post<Order>(API_PATHS.ORDERS, orderData);
  return handleApiResponse(response);
};

export const orderService = {
  createOrder,
  getOrders: async (
    filters: FindAllOrdersDto = {},
  ): Promise<PaginatedResponse<Order>> => {
    const queryParams: Record<string, any> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        if (key !== 'page' && key !== 'limit') {
          queryParams[key] = value;
        }
      }
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    queryParams.page = page;
    queryParams.limit = limit;
    const response = await apiClient.get<[Order[], number]>(
      API_PATHS.ORDERS,
      queryParams,
    );

    if (
      !response.ok ||
      !response.data ||
      !Array.isArray(response.data) ||
      response.data.length !== 2
    ) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }

    const [data, total] = response.data;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  },
  getOpenOrdersCurrentShift: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(
      API_PATHS.ORDERS_OPEN_CURRENT_SHIFT,
    );
    return handleApiResponse(response);
  },
  getOpenOrdersList: async (): Promise<OrderOpenList[]> => {
    const response = await apiClient.get<OrderOpenList[]>(
      API_PATHS.ORDERS_OPEN_ORDERS_LIST,
    );
    return handleApiResponse(response);
  },
  printOrderTicket: async (
    orderId: string,
    printerId: string,
  ): Promise<void> => {
    const url = API_PATHS.PRINT_ORDER_TICKET;
    const body = { orderId, printerId };
    const response = await apiClient.post<any>(url, body);

    if (!response.ok) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
  },
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },
  updateOrder: async (
    orderId: string,
    payload: UpdateOrderPayload,
  ): Promise<Order> => {
    const response = await apiClient.patch<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
      payload,
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },
  cancelOrder: async (orderId: string): Promise<Order> => {
    const payload: UpdateOrderPayload = {
      orderStatus: 'CANCELLED',
    };

    const response = await apiClient.patch<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
      payload,
    );

    if (!response.ok || !response.data) {
      throw ApiError.fromApiResponse(response.data, response.status);
    }
    return response.data;
  },
};

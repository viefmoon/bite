import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Order } from '../../../app/schemas/domain/order.schema';
import type { OrderOpenList } from '../schema/orders.schema';
import type { OrderDetailsForBackend } from '../utils/orderUtils';
import type { UpdateOrderPayload } from '../schema/update-order.schema';

const createOrder = async (
  orderData: OrderDetailsForBackend,
): Promise<Order> => {
  const response = await apiClient.post<Order>(API_PATHS.ORDERS, orderData);
  return response.data;
};

export const orderService = {
  createOrder,
  getOpenOrdersList: async (): Promise<OrderOpenList[]> => {
    const response = await apiClient.get<OrderOpenList[]>(
      API_PATHS.ORDERS_OPEN_ORDERS_LIST,
    );
    return response.data;
  },
  getOrderById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get<Order>(
      API_PATHS.ORDERS_BY_ID.replace(':orderId', orderId),
    );
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
    return response.data;
  },
};

import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  OrderForFinalization,
  OrderForFinalizationList,
  FinalizeOrdersPayload,
} from '../types/orderFinalization.types';

export const orderFinalizationService = {
  async getOrdersForFinalizationList(): Promise<OrderForFinalizationList[]> {
    const response = await apiClient.get(API_PATHS.ORDERS_FOR_FINALIZATION_LIST);
    return response.data;
  },

  async getOrderForFinalizationDetail(orderId: string): Promise<OrderForFinalization> {
    const response = await apiClient.get(
      API_PATHS.ORDERS_FOR_FINALIZATION_DETAIL.replace(':id', orderId),
    );
    return response.data;
  },

  async finalizeOrders(payload: FinalizeOrdersPayload): Promise<void> {
    await apiClient.patch(API_PATHS.ORDERS_FINALIZE_MULTIPLE, payload);
  },

  async quickFinalizeMultipleOrders(orderIds: string[]): Promise<{ message: string; ordersWithWarnings: string[] }> {
    const response = await apiClient.post('/api/v1/orders/quick-finalize-multiple', { orderIds });
    return response.data;
  },
};

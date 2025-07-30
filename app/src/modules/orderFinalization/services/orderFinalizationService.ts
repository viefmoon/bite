import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  OrderForFinalization,
  OrderForFinalizationList,
} from '../schema/orderFinalization.schema';

export const orderFinalizationService = {
  async getOrdersForFinalizationList(): Promise<OrderForFinalizationList[]> {
    const response = await apiClient.get(
      API_PATHS.ORDERS_FOR_FINALIZATION_LIST,
    );
    return response.data;
  },

  async getOrderForFinalizationDetail(
    orderId: string,
  ): Promise<OrderForFinalization> {
    const response = await apiClient.get(
      API_PATHS.ORDERS_FOR_FINALIZATION_DETAIL.replace(':id', orderId),
    );
    return response.data;
  },

  async quickFinalizeMultipleOrders(
    orderIds: string[],
  ): Promise<{ message: string; ordersWithWarnings: string[] }> {
    const response = await apiClient.post(
      API_PATHS.ORDERS_QUICK_FINALIZE_MULTIPLE,
      { orderIds },
    );
    return response.data;
  },

  async printTicket(
    orderId: string,
    params: { printerId: string; ticketType: 'GENERAL' | 'BILLING' },
  ): Promise<void> {
    await apiClient.post(
      API_PATHS.ORDERS_PRINT_TICKET.replace(':orderId', orderId),
      params,
    );
  },
};

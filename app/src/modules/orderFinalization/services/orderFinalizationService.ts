import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  OrderForFinalization,
  FinalizeOrdersPayload,
} from '../types/orderFinalization.types';

export const orderFinalizationService = {
  // Obtener órdenes listas para finalizar
  async getOrdersForFinalization(): Promise<OrderForFinalization[]> {
    const response = await apiClient.get(API_PATHS.ORDERS_FOR_FINALIZATION);
    return response.data;
  },

  // Finalizar múltiples órdenes
  async finalizeOrders(payload: FinalizeOrdersPayload): Promise<void> {
    await apiClient.patch(API_PATHS.ORDERS_FINALIZE_MULTIPLE, payload);
  },

  // Obtener detalle de una orden
  async getOrderDetail(orderId: string): Promise<OrderForFinalization> {
    const response = await apiClient.get(
      API_PATHS.ORDERS_DETAIL.replace(':orderId', orderId),
    );
    return response.data;
  },
};

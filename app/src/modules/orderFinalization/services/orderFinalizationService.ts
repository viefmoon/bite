import apiClient from '@/app/services/apiClient';
import { OrderForFinalization, FinalizeOrdersPayload } from '../types/orderFinalization.types';

export const orderFinalizationService = {
  // Obtener órdenes listas para finalizar
  async getOrdersForFinalization(): Promise<OrderForFinalization[]> {
    const response = await apiClient.get('/api/v1/orders/for-finalization');
    return response.data;
  },

  // Finalizar múltiples órdenes
  async finalizeOrders(payload: FinalizeOrdersPayload): Promise<void> {
    await apiClient.patch('/api/v1/orders/finalize-multiple', payload);
  },

  // Obtener detalle de una orden
  async getOrderDetail(orderId: string): Promise<OrderForFinalization> {
    const response = await apiClient.get(`/api/v1/orders/${orderId}/detail`);
    return response.data;
  },
};
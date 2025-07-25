import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Adjustment } from '@/app/schemas/domain/adjustment.schema';
import type { OrderAdjustmentDto } from '../types/update-order.types';

export const adjustmentService = {
  /**
   * Crea múltiples ajustes para una orden
   */
  createBulkAdjustments: async (
    adjustments: OrderAdjustmentDto[],
  ): Promise<Adjustment[]> => {
    const response = await apiClient.post<Adjustment[]>(
      API_PATHS.ADJUSTMENTS + '/bulk',
      adjustments,
    );
    return response.data;
  },

  /**
   * Obtiene los ajustes de una orden
   */
  getOrderAdjustments: async (orderId: string): Promise<Adjustment[]> => {
    const response = await apiClient.get<Adjustment[]>(
      API_PATHS.ADJUSTMENTS + '/order/' + orderId,
    );
    return response.data;
  },

  /**
   * Elimina un ajuste (solo admin)
   */
  deleteAdjustment: async (adjustmentId: string): Promise<void> => {
    await apiClient.delete<void>(
      API_PATHS.ADJUSTMENTS_BY_ID.replace(':id', adjustmentId),
    );
  },

  /**
   * Obtiene el total de ajustes de una orden
   */
  getOrderAdjustmentsTotal: async (
    orderId: string,
  ): Promise<{ total: number }> => {
    const response = await apiClient.get<{ total: number }>(
      API_PATHS.ADJUSTMENTS + '/order/' + orderId + '/total',
    );
    return response.data;
  },
};

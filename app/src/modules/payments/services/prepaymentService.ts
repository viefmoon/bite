import apiClient from '@/app/services/apiClient';
import { handleApiResponse, handleApiResponseVoid } from '@/app/lib/apiHelpers';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Payment } from '../types/payment.types';

interface CreatePrepaymentDto {
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  amount: number;
}

interface UpdatePrepaymentDto {
  paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER';
  amount?: number;
}

export const prepaymentService = {
  /**
   * Crear un pre-pago (pago sin orden asociada)
   */
  createPrepayment: async (data: CreatePrepaymentDto): Promise<Payment> => {
    const response = await apiClient.post<Payment>(
      API_PATHS.PAYMENTS_PREPAYMENT,
      data,
    );
    return handleApiResponse(response);
  },

  /**
   * Actualizar un pre-pago existente
   */
  updatePrepayment: async (
    paymentId: string,
    data: UpdatePrepaymentDto,
  ): Promise<Payment> => {
    const response = await apiClient.patch<Payment>(
      API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', paymentId),
      data,
    );
    return handleApiResponse(response);
  },

  /**
   * Asociar un pre-pago a una orden
   */
  associateToOrder: async (
    paymentId: string,
    orderId: string,
  ): Promise<Payment> => {
    const response = await apiClient.patch<Payment>(
      API_PATHS.PAYMENTS_ASSOCIATE.replace(':paymentId', paymentId).replace(
        ':orderId',
        orderId,
      ),
    );
    return handleApiResponse(response);
  },

  /**
   * Eliminar un pre-pago
   */
  deletePrepayment: async (paymentId: string): Promise<void> => {
    const response = await apiClient.delete(
      API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', paymentId),
    );
    handleApiResponseVoid(response);
  },
};

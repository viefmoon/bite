import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { Payment } from '../../orders/schema/payment.schema';

interface CreatePrepaymentDto {
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  amount: number;
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
    return response.data;
  },

  /**
   * Eliminar un pre-pago
   */
  deletePrepayment: async (paymentId: string): Promise<void> => {
    await apiClient.delete(
      API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', paymentId),
    );
  },
};

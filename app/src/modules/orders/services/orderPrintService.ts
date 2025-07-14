import apiClient from '@/app/services/apiClient';

interface PrintTicketPayload {
  printerId: string;
  ticketType: 'GENERAL' | 'BILLING';
}

export const orderPrintService = {
  /**
   * Imprime un ticket para una orden
   */
  printTicket: async (orderId: string, payload: PrintTicketPayload) => {
    const response = await apiClient.post(
      `/api/v1/orders/${orderId}/print-ticket`,
      payload,
    );
    return response.data;
  },
};

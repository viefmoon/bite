import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';

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
      API_PATHS.ORDERS_PRINT_TICKET.replace(':orderId', orderId),
      payload,
    );
    return response.data;
  },
};

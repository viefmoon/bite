import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentMethod,
  PaymentStatus,
} from '../schema/payment.schema';

class PaymentService {
  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const response = await apiClient.post<Payment>(API_PATHS.PAYMENTS, dto);
    return response.data;
  }

  async getPayments(filters?: {
    orderId?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
  }): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(API_PATHS.PAYMENTS, {
      params: filters,
    });
    return response.data;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(
      API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', id),
    );
    return response.data;
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(
      API_PATHS.PAYMENTS_BY_ORDER.replace(':orderId', orderId),
    );
    return response.data;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const response = await apiClient.patch<Payment>(
      API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', id),
      dto,
    );
    return response.data;
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(API_PATHS.PAYMENTS_BY_ID.replace(':paymentId', id));
  }
}

export const paymentService = new PaymentService();

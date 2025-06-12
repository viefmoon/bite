import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentMethod,
  PaymentStatus,
} from '../types/payment.types';

class PaymentService {
  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const { data } = await apiClient.post<Payment>(API_PATHS.PAYMENTS, dto);
    return data;
  }

  async getPayments(filters?: {
    orderId?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
  }): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(API_PATHS.PAYMENTS, {
      params: filters,
    });
    return data;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const { data } = await apiClient.get<Payment>(
      `${API_PATHS.PAYMENTS}/${id}`,
    );
    return data;
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(
      API_PATHS.PAYMENTS_BY_ORDER.replace(':orderId', orderId),
    );
    return data;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const { data } = await apiClient.patch<Payment>(
      `${API_PATHS.PAYMENTS}/${id}`,
      dto,
    );
    return data;
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`${API_PATHS.PAYMENTS}/${id}`);
  }
}

export const paymentService = new PaymentService();

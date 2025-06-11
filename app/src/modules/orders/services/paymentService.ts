import apiClient from '../../../app/services/apiClient';
import type { 
  Payment, 
  CreatePaymentDto, 
  UpdatePaymentDto,
  PaymentMethod,
  PaymentStatus 
} from '../types/payment.types';

class PaymentService {
  private baseUrl = '/api/v1/payments';

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    const { data } = await apiClient.post<Payment>(this.baseUrl, dto);
    return data;
  }

  async getPayments(filters?: {
    orderId?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
  }): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(this.baseUrl, { params: filters });
    return data;
  }

  async getPaymentById(id: string): Promise<Payment> {
    const { data } = await apiClient.get<Payment>(`${this.baseUrl}/${id}`);
    return data;
  }

  async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(`${this.baseUrl}/order/${orderId}`);
    return data;
  }

  async updatePayment(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const { data } = await apiClient.patch<Payment>(`${this.baseUrl}/${id}`, dto);
    return data;
  }

  async deletePayment(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const paymentService = new PaymentService();
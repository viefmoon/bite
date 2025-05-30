import { Payment } from '../../domain/payment';

export interface PaymentRepository {
  findAll(): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  create(payment: Payment): Promise<Payment>;
  update(id: string, payment: Payment): Promise<Payment>;
  delete(id: string): Promise<void>;
}

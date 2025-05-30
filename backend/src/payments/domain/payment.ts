import { Order } from '../../orders/domain/order';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';

export class Payment {
  id: string;

  orderId: string;

  paymentMethod: PaymentMethod;

  amount: number;

  paymentStatus: PaymentStatus;

  order: Order;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

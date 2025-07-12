import { Order } from '../../orders/domain/order';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';

export { PaymentStatus } from './enums/payment-status.enum';
export { PaymentMethod } from './enums/payment-method.enum';

export class Payment {
  id: string;

  orderId: string | null;

  paymentMethod: PaymentMethod;

  amount: number;

  paymentStatus: PaymentStatus;

  order: Order | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

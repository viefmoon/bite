import { User } from '../../users/domain/user';
import { Table } from '../../tables/domain/table';
import { Customer } from '../../customers/domain/customer';
import { DailyOrderCounter } from './daily-order-counter';
import { OrderStatus } from './enums/order-status.enum';
import { OrderType } from './enums/order-type.enum';
import { Payment } from '../../payments/domain/payment';
import { OrderItem } from './order-item'; // Importar OrderItem
import { Adjustment } from '../../adjustments/domain/adjustment';

export class Order {
  id: string;

  userId: string;

  tableId: string | null;

  dailyNumber: number;

  dailyOrderCounterId: string;

  scheduledAt: Date | null;

  orderStatus: OrderStatus;

  orderType: OrderType;

  subtotal: number;

  total: number;

  user: User;

  table: Table | null;

  dailyOrderCounter: DailyOrderCounter;

  orderItems: OrderItem[];
  payments: Payment[] | null;
  adjustments?: Adjustment[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  notes?: string;

  phoneNumber?: string | null;

  customerName?: string | null;

  customerId?: string | null;

  customer?: Customer | null;

  deliveryAddress?: string | null;
}

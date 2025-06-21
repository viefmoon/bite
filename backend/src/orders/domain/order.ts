import { User } from '../../users/domain/user';
import { Table } from '../../tables/domain/table';
import { Customer } from '../../customers/domain/customer';
import { DailyOrderCounter } from './daily-order-counter';
import { OrderStatus } from './enums/order-status.enum';
import { OrderType } from './enums/order-type.enum';
import { Payment } from '../../payments/domain/payment';
import { OrderItem } from './order-item'; // Importar OrderItem
import { Adjustment } from '../../adjustments/domain/adjustment';
import { DeliveryInfo } from './delivery-info';

export class Order {
  id: string;

  userId: string | null;

  tableId: string | null;

  dailyNumber: number;

  dailyOrderCounterId: string;

  scheduledAt: Date | null;

  orderStatus: OrderStatus;

  orderType: OrderType;

  subtotal: number;

  total: number;

  user: User | null;

  table: Table | null;

  dailyOrderCounter: DailyOrderCounter;

  orderItems: OrderItem[];
  payments: Payment[] | null;
  adjustments?: Adjustment[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  notes?: string;

  customerId?: string | null;

  customer?: Customer | null;

  isFromWhatsApp?: boolean;

  deliveryInfo: DeliveryInfo;
}

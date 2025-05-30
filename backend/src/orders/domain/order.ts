import { User } from '../../users/domain/user';
import { Table } from '../../tables/domain/table';
import { DailyOrderCounter } from './daily-order-counter';
import { OrderStatus } from './enums/order-status.enum';
import { OrderType } from './enums/order-type.enum';
import { Payment } from '../../payments/domain/payment';
import { OrderItem } from './order-item'; // Importar OrderItem

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

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;

  notes?: string;

  phoneNumber?: string | null;

  customerName?: string | null;

  deliveryAddress?: string | null;
}

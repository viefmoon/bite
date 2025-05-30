import { Order } from './order';

export class DailyOrderCounter {
  id: string;

  date: Date;

  currentNumber: number;

  orders: Order[] | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

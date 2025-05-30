import { Order } from './order';
import { User } from '../../users/domain/user';
import { TicketType } from './enums/ticket-type.enum';

export class TicketImpression {
  id: string;

  orderId: string;

  userId: string;

  ticketType: TicketType;

  impressionTime: Date;

  order: Order;

  user: User;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

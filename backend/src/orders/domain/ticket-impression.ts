import { Order } from './order';
import { User } from '../../users/domain/user';
import { TicketType } from './enums/ticket-type.enum';
import { ThermalPrinter } from '../../thermal-printers/domain/thermal-printer';

export class TicketImpression {
  id: string;

  orderId: string;

  userId: string;

  printerId?: string;

  ticketType: TicketType;

  impressionTime: Date;

  order?: Order;

  user?: User | null;

  printer?: ThermalPrinter | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

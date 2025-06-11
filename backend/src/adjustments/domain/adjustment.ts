import { AdjustmentType } from './enums/adjustment-type.enum';
import { Order } from '../../orders/domain/order';
import { OrderItem } from '../../orders/domain/order-item';
import { User } from '../../users/domain/user';

export class Adjustment {
  id: string;
  type: AdjustmentType;
  orderId?: string | null;
  orderItemId?: string | null;
  name: string;
  description?: string | null;
  isPercentage: boolean;
  value: number;
  amount: number;
  appliedById: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Relations
  order?: Order | null;
  orderItem?: OrderItem | null;
  appliedBy?: User | null;
}

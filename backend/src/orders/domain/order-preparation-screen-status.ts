import { User } from '../../users/domain/user';
import { PreparationScreen } from '../../preparation-screens/domain/preparation-screen';

export enum PreparationScreenStatus {
  PENDING = 'PENDING',
  IN_PREPARATION = 'IN_PREPARATION',
  READY = 'READY',
}

export class OrderPreparationScreenStatus {
  id: string;
  orderId: string;
  preparationScreenId: string;
  status: PreparationScreenStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  startedById?: string | null;
  completedById?: string | null;
  startedBy?: User | null;
  completedBy?: User | null;
  preparationScreen?: PreparationScreen;
  createdAt?: Date;
  updatedAt?: Date;
}

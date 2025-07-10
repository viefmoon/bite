import { Expose } from 'class-transformer';
import { Product } from '../../products/domain/product';
import { User } from '../../users/domain/user';

export class PreparationScreen {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  isActive: boolean;

  @Expose()
  products: Product[] | null;

  @Expose()
  users: User[] | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  deletedAt: Date | null;
}

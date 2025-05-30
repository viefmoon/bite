import { Product } from '../../products/domain/product';

export class PreparationScreen {
  id: string;

  name: string;

  description: string | null;

  isActive: boolean;

  products: Product[] | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

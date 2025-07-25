import { Product } from '../../products/domain/product';

export class ProductVariant {
  id: string;

  productId: string;

  name: string;

  price: number;

  isActive: boolean;

  sortOrder: number;

  product?: Product;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}

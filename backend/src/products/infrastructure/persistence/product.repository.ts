import { Product } from '../../domain/product';
import { Paginated } from '../../../common/types/paginated.type';

export interface ProductRepository {
  create(product: Product): Promise<Product>;
  findAll(options: {
    page: number;
    limit: number;
    subcategoryId?: string;
    hasVariants?: boolean;
    isActive?: boolean;
    search?: string;
  }): Promise<Paginated<Product>>;
  findOne(id: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  save(product: Product): Promise<Product>;
  softDelete(id: string): Promise<void>;
}

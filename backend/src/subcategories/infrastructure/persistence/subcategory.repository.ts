import { Paginated } from '../../../common/types/paginated.type';
import { Subcategory } from '../../domain/subcategory';

export interface SubcategoryRepository {
  create(data: Subcategory): Promise<Subcategory>;
  findOne(id: string): Promise<Subcategory>;
  findAll(options?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Paginated<Subcategory>>;
  update(id: string, data: Subcategory): Promise<Subcategory>;
  softDelete(id: string): Promise<void>;
}

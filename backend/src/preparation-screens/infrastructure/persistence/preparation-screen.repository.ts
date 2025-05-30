import { PreparationScreen } from '../../domain/preparation-screen';
import { Paginated } from '../../../common/types/paginated.type';

export interface PreparationScreenRepository {
  create(data: PreparationScreen): Promise<PreparationScreen>;
  findOne(id: string): Promise<PreparationScreen>;
  findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<Paginated<PreparationScreen>>;
  update(id: string, data: PreparationScreen): Promise<PreparationScreen>;
  softDelete(id: string): Promise<void>;
}

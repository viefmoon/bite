import { PreparationScreen } from '../../domain/preparation-screen';
import { Paginated } from '../../../common/types/paginated.type';
import { UserAssignmentDto } from '../../dto/assign-users.dto';

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
  findByIds(ids: string[]): Promise<PreparationScreen[]>;
  getUsersByScreenId(screenId: string): Promise<any[]>;
  getUsers(screenId: string): Promise<any[]>;
  assignUsers(
    screenId: string,
    userAssignments: UserAssignmentDto[],
  ): Promise<void>;
  removeUsers(screenId: string, userIds: string[]): Promise<void>;
}

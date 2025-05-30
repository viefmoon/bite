import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ModifierGroup } from '../../domain/modifier-group';
import { FindAllModifierGroupsDto } from '../../dto/find-all-modifier-groups.dto';
import { Paginated } from '../../../common/types/paginated.type';

export abstract class ModifierGroupRepository {
  abstract create(
    data: Omit<ModifierGroup, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<ModifierGroup>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllModifierGroupsDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Paginated<ModifierGroup>>;

  abstract findById(
    id: ModifierGroup['id'],
  ): Promise<NullableType<ModifierGroup>>;
  abstract findByName(
    name: ModifierGroup['name'],
  ): Promise<NullableType<ModifierGroup>>;

  abstract update(
    id: ModifierGroup['id'],
    payload: DeepPartial<ModifierGroup>,
  ): Promise<ModifierGroup | null>;

  abstract remove(id: ModifierGroup['id']): Promise<void>;
}

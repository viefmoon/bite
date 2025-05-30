import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Table } from '../../domain/table';
import { FindAllTablesDto } from '../../dto/find-all-tables.dto';

export abstract class TableRepository {
  abstract create(
    data: Omit<Table, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<Table>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllTablesDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Table[]>;

  abstract findById(id: Table['id']): Promise<NullableType<Table>>;
  abstract findByName(name: Table['name']): Promise<NullableType<Table>>;
  abstract findByAreaId(areaId: Table['areaId']): Promise<Table[]>;

  abstract update(
    id: Table['id'],
    payload: DeepPartial<Table>,
  ): Promise<Table | null>;

  abstract remove(id: Table['id']): Promise<void>;
}

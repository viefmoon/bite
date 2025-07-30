import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BaseListQuery } from '../../../app/types/query.types';
import type { Table } from '@/app/schemas/domain/table.schema';
import {
  CreateTableDto,
  UpdateTableDto,
  FindAllTablesDto,
} from '../schema/table-form.schema';

const getTablesByAreaId = async (
  areaId: string,
  filterOptions: Omit<FindAllTablesDto, 'areaId'> = {},
  paginationOptions: BaseListQuery = { page: 1, limit: 100 },
): Promise<Table[]> => {
  const response = await apiClient.get<{
    items: Table[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.TABLES_BY_AREA.replace(':areaId', areaId), {
    params: {
      ...filterOptions,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
    },
  });

  return response.data.items;
};

const createTable = async (data: CreateTableDto): Promise<Table> => {
  const response = await apiClient.post<Table>(API_PATHS.TABLES, data);

  return response.data;
};

const updateTable = async (
  id: string,
  data: UpdateTableDto,
): Promise<Table> => {
  const response = await apiClient.patch<Table>(
    API_PATHS.TABLES_BY_ID.replace(':id', id),
    data,
  );

  return response.data;
};

const deleteTable = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.TABLES_BY_ID.replace(':id', id));
};

export const tableService = {
  getTablesByAreaId,
  createTable,
  updateTable,
  deleteTable,
};

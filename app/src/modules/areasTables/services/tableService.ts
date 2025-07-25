import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../app/services/apiClient';
import { ApiError } from '../../../app/lib/errors';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BaseListQuery } from '../../../app/types/query.types';
import {
  Table,
  CreateTableDto,
  UpdateTableDto,
  FindAllTablesDto,
} from '../schema/table.schema';

export const getTables = async (
  filterOptions: FindAllTablesDto = {},
  paginationOptions: BaseListQuery = { page: 1, limit: 10 },
): Promise<Table[]> => {
  const response = await apiClient.get<{
    items: Table[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.TABLES, {
    params: {
      ...filterOptions,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
    },
  });

  return response.data.items;
};

export const getTablesByAreaId = async (areaId: string): Promise<Table[]> => {
  const response = await apiClient.get<{
    items: Table[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.TABLES_BY_AREA.replace(':areaId', areaId));

  return response.data.items;
};

export const getTableById = async (id: string): Promise<Table> => {
  const response = await apiClient.get<Table>(
    API_PATHS.TABLES_BY_ID.replace(':id', id),
  );

  return response.data;
};

export const createTable = async (data: CreateTableDto): Promise<Table> => {
  const response = await apiClient.post<Table>(API_PATHS.TABLES, data);

  return response.data;
};

export const updateTable = async (
  id: string,
  data: UpdateTableDto,
): Promise<Table> => {
  const response = await apiClient.patch<Table>(
    API_PATHS.TABLES_BY_ID.replace(':id', id),
    data,
  );

  return response.data;
};

export const deleteTable = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.TABLES_BY_ID.replace(':id', id));
};

// Claves de Query para tablas relacionadas con áreas
const tableQueryKeys = {
  base: ['tables'] as const, // Clave base para todas las tablas
  byArea: (areaId: string | null | undefined) =>
    [...tableQueryKeys.base, 'area', areaId] as const,
};

export function useGetTablesByArea(areaId: string | null | undefined) {
  return useQuery<Table[], ApiError>({
    queryKey: tableQueryKeys.byArea(areaId),
    queryFn: () => {
      if (!areaId) {
        return Promise.resolve([]);
      }
      return getTablesByAreaId(areaId);
    },
    enabled: !!areaId,
    // Sin staleTime, se usará la configuración global (0)
  });
}

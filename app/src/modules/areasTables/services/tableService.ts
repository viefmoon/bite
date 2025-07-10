import { useQuery } from '@tanstack/react-query';
import ApiClientWrapper from '../../../app/services/apiClientWrapper';
import { ApiError } from '../../../app/lib/errors';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BackendErrorResponse } from '../../../app/types/api.types';
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
  const response = await ApiClientWrapper.get<{
    items: Table[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.TABLES, {
    ...filterOptions,
    page: paginationOptions.page,
    limit: paginationOptions.limit,
  });

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data.items;
};

export const getTablesByAreaId = async (areaId: string): Promise<Table[]> => {
  const response = await ApiClientWrapper.get<{
    items: Table[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(`${API_PATHS.TABLES}/area/${areaId}`);

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data.items;
};

export const getTableById = async (id: string): Promise<Table> => {
  const response = await ApiClientWrapper.get<Table>(
    `${API_PATHS.TABLES}/${id}`,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const createTable = async (data: CreateTableDto): Promise<Table> => {
  const response = await ApiClientWrapper.post<Table>(API_PATHS.TABLES, data);

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const updateTable = async (
  id: string,
  data: UpdateTableDto,
): Promise<Table> => {
  const response = await ApiClientWrapper.patch<Table>(
    `${API_PATHS.TABLES}/${id}`,
    data,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const deleteTable = async (id: string): Promise<void> => {
  const response = await ApiClientWrapper.delete(`${API_PATHS.TABLES}/${id}`);

  if (!response.ok) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
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

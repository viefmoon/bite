import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../app/services/apiClient';
import { ApiError } from '../../../app/lib/errors';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BaseListQuery } from '../../../app/types/query.types';
import {
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  FindAllAreasDto,
} from '../schema/area.schema';

export const getAreas = async (
  filterOptions: FindAllAreasDto = {},
  paginationOptions: BaseListQuery = { page: 1, limit: 10 },
): Promise<Area[]> => {
  const response = await apiClient.get<{
    items: Area[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.AREAS, {
    params: {
      ...filterOptions,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
    },
  });

  return response.data.items;
};

export const getAreaById = async (id: string): Promise<Area> => {
  const response = await apiClient.get<Area>(
    API_PATHS.AREAS_BY_ID.replace(':id', id),
  );

  return response.data;
};

export const createArea = async (data: CreateAreaDto): Promise<Area> => {
  const response = await apiClient.post<Area>(API_PATHS.AREAS, data);

  return response.data;
};

export const updateArea = async (
  id: string,
  data: UpdateAreaDto,
): Promise<Area> => {
  const response = await apiClient.patch<Area>(
    API_PATHS.AREAS_BY_ID.replace(':id', id),
    data,
  );

  return response.data;
};

export const deleteArea = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.AREAS_BY_ID.replace(':id', id));
};

// Claves de Query para áreas
const areaQueryKeys = {
  all: ['areas'] as const,
};

/**
 * Hook para obtener la lista de todas las áreas activas usando React Query.
 */
export function useGetAreas() {
  return useQuery<Area[], ApiError>({
    queryKey: areaQueryKeys.all,
    queryFn: () => getAreas(), // Llama a getAreas sin argumentos para obtener todos por defecto
    // Sin staleTime, se usará la configuración global (0)
  });
}

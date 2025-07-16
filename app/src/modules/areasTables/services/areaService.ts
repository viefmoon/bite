import { useQuery } from '@tanstack/react-query';
import ApiClientWrapper from '../../../app/services/apiClientWrapper';
import { ApiError } from '../../../app/lib/errors';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BackendErrorResponse } from '../../../app/types/api.types';
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
  const response = await ApiClientWrapper.get<{
    items: Area[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.AREAS, {
    ...filterOptions,
    page: paginationOptions.page,
    limit: paginationOptions.limit,
  });

  if (!response.ok || !response.data) {
    // Error al obtener áreas
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data.items;
};

export const getAreaById = async (id: string): Promise<Area> => {
  const response = await ApiClientWrapper.get<Area>(`${API_PATHS.AREAS}/${id}`);

  if (!response.ok || !response.data) {
    // Error al obtener área por ID
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const createArea = async (data: CreateAreaDto): Promise<Area> => {
  const response = await ApiClientWrapper.post<Area>(API_PATHS.AREAS, data);

  if (!response.ok || !response.data) {
    // Error al crear área
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const updateArea = async (
  id: string,
  data: UpdateAreaDto,
): Promise<Area> => {
  const response = await ApiClientWrapper.patch<Area>(
    `${API_PATHS.AREAS}/${id}`,
    data,
  );

  if (!response.ok || !response.data) {
    // Error al actualizar área
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

export const deleteArea = async (id: string): Promise<void> => {
  const response = await ApiClientWrapper.delete(`${API_PATHS.AREAS}/${id}`);

  if (!response.ok) {
    // Error al eliminar área
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
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

import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { BaseListQuery } from '../../../app/types/query.types';
import type { Area } from '@/app/schemas/domain/area.schema';
import {
  CreateAreaDto,
  UpdateAreaDto,
  FindAllAreasDto,
} from '../schema/area-form.schema';

const getAreas = async (
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

const getAreaById = async (id: string): Promise<Area> => {
  const response = await apiClient.get<Area>(
    API_PATHS.AREAS_BY_ID.replace(':id', id),
  );

  return response.data;
};

const createArea = async (data: CreateAreaDto): Promise<Area> => {
  const response = await apiClient.post<Area>(API_PATHS.AREAS, data);

  return response.data;
};

const updateArea = async (id: string, data: UpdateAreaDto): Promise<Area> => {
  const response = await apiClient.patch<Area>(
    API_PATHS.AREAS_BY_ID.replace(':id', id),
    data,
  );

  return response.data;
};

const deleteArea = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.AREAS_BY_ID.replace(':id', id));
};

export const areaService = {
  getAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
};

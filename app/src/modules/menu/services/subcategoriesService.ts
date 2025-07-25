import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import {
  SubCategory,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  findAllSubcategoriesDtoSchema,
} from '../schema/subcategories.schema';
import { z } from 'zod';
import { PaginatedResponse } from '../../../app/types/api.types';

type FindAllSubcategoriesDto = z.infer<typeof findAllSubcategoriesDtoSchema>;

export const createSubcategory = async (
  data: CreateSubCategoryDto,
): Promise<SubCategory> => {
  const response = await apiClient.post<SubCategory>(
    API_PATHS.SUBCATEGORIES,
    data,
  );
  return response.data;
};

export const findAllSubcategories = async (
  params: FindAllSubcategoriesDto,
): Promise<PaginatedResponse<SubCategory>> => {
  const queryParams = Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>,
  );

  const response = await apiClient.get<{
    items: SubCategory[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.SUBCATEGORIES, { params: queryParams });

  // Transforma la respuesta del backend a PaginatedResponse
  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
};

export const findOneSubcategory = async (id: string): Promise<SubCategory> => {
  const response = await apiClient.get<SubCategory>(
    API_PATHS.SUBCATEGORIES_BY_ID.replace(':id', id),
  );
  return response.data;
};

export const updateSubcategory = async (
  id: string,
  data: UpdateSubCategoryDto,
): Promise<SubCategory> => {
  const response = await apiClient.patch<SubCategory>(
    API_PATHS.SUBCATEGORIES_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
};

export const removeSubcategory = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.SUBCATEGORIES_BY_ID.replace(':id', id));
};

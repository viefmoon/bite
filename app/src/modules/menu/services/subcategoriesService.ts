import apiClient from "../../../app/services/apiClient";
import { ApiError } from "../../../app/lib/errors";
import { API_PATHS } from "../../../app/constants/apiPaths";
import {
  SubCategory,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  findAllSubcategoriesDtoSchema,
} from "../schema/subcategories.schema";
import { z } from 'zod';
import { PaginatedResponse } from "../../../app/types/api.types";


type FindAllSubcategoriesDto = z.infer<typeof findAllSubcategoriesDtoSchema>;

export const createSubcategory = async (
  data: CreateSubCategoryDto
): Promise<SubCategory> => {
  const response = await apiClient.post<SubCategory>(API_PATHS.SUBCATEGORIES, data);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
};

export const findAllSubcategories = async (
  params: FindAllSubcategoriesDto
): Promise<PaginatedResponse<SubCategory>> => {
  const queryParams = Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const response = await apiClient.get<[SubCategory[], number]>(
    API_PATHS.SUBCATEGORIES,
    queryParams
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  // Transforma la respuesta de tupla a PaginatedResponse
  const [data, total] = response.data;
  return {
    data,
    total,
    page: params.page || 1,
    limit: params.limit || 10,
    totalPages: Math.ceil(total / (params.limit || 10)),
  };
};

export const findOneSubcategory = async (id: string): Promise<SubCategory> => {
  const response = await apiClient.get<SubCategory>(`${API_PATHS.SUBCATEGORIES}/${id}`);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
};

export const updateSubcategory = async (
  id: string,
  data: UpdateSubCategoryDto
): Promise<SubCategory> => {
  const response = await apiClient.patch<SubCategory>(
    `${API_PATHS.SUBCATEGORIES}/${id}`,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
};

export const removeSubcategory = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`${API_PATHS.SUBCATEGORIES}/${id}`);
  if (!response.ok) {
    if (response.data) {
      // Hay un cuerpo de error definido por el backend
      throw ApiError.fromApiResponse(response.data, response.status);
    } else if (response.status !== 404) {
      // No hay cuerpo de error, pero no es un 404 esperado
      throw new Error(`Error deleting subcategory ${id}: Status ${response.status}`);
    }
    // Si es 404, no se lanza error.
  }
  // No se devuelve nada en caso de éxito (204) o 404.
};

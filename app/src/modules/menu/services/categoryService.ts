import apiClient from "../../../app/services/apiClient";
import { ApiError } from "../../../app/lib/errors";
import { API_PATHS } from "../../../app/constants/apiPaths";
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../schema/category.schema";
import { PaginatedResponse } from '../../../app/types/api.types';

export const getCategories = async (params?: {
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Category>> => {
  const response = await apiClient.get<{
    items: Category[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(
    API_PATHS.CATEGORIES,
    params
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }

  // Transforma la respuesta del backend a PaginatedResponse
  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await apiClient.get<Category>(
    `${API_PATHS.CATEGORIES}/${id}`
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }
  return response.data;
};

export const createCategory = async (
  data: CreateCategoryDto
): Promise<Category> => {
  const response = await apiClient.post<Category>(API_PATHS.CATEGORIES, data);

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }
  return response.data;
};

export const updateCategory = async (
  id: string,
  data: UpdateCategoryDto
): Promise<Category> => {
  console.log('[categoryService] updateCategory called with:', { id, data });
  
  const response = await apiClient.patch<Category>(
    `${API_PATHS.CATEGORIES}/${id}`,
    data
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }
  
  console.log('[categoryService] updateCategory response:', response.data);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`${API_PATHS.CATEGORIES}/${id}`);

  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }
};

export async function getFullMenu(): Promise<Category[]> {
  const response = await apiClient.get<Category[]>(
    `${API_PATHS.CATEGORIES}/full-menu`
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }

  return response.data;
}

const categoryService = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getFullMenu,
};

export default categoryService;

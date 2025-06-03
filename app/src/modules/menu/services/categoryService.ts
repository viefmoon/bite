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
  const response = await apiClient.get<[Category[], number]>(
    API_PATHS.CATEGORIES,
    params
  );

  if (
    !response.ok ||
    !response.data ||
    !Array.isArray(response.data) ||
    response.data.length !== 2
  ) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }

  const [categoriesData, totalCount] = response.data;
  const page = params?.page ?? 1;
  const limit =
    params?.limit ?? (categoriesData.length > 0 ? categoriesData.length : 10);

  const paginatedResponse: PaginatedResponse<Category> = {
    data: categoriesData,
    total: totalCount,
    page: page,
    limit: limit,
    totalPages: limit > 0 ? Math.ceil(totalCount / limit) : totalCount > 0 ? 1 : 0,
  };

  return paginatedResponse;
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
  const response = await apiClient.patch<Category>(
    `${API_PATHS.CATEGORIES}/${id}`,
    data
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status ?? 500);
  }
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

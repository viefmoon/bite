import apiClient from '../../../app/services/apiClient';
import { API_PATHS } from '../../../app/constants/apiPaths';
import { Category } from '@/app/schemas/domain/category.schema';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../schema/category-form.schema';
import { PaginatedResponse } from '../../../app/types/api.types';
import type { FullMenuCategory } from '@/modules/orders/schema/orders.schema';

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
  }>(API_PATHS.CATEGORIES, { params });

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
    API_PATHS.CATEGORIES_BY_ID.replace(':id', id),
  );
  return response.data;
};

export const createCategory = async (
  data: CreateCategoryDto,
): Promise<Category> => {
  const response = await apiClient.post<Category>(API_PATHS.CATEGORIES, data);
  return response.data;
};

export const updateCategory = async (
  id: string,
  data: UpdateCategoryDto,
): Promise<Category> => {
  const response = await apiClient.patch<Category>(
    API_PATHS.CATEGORIES_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(API_PATHS.CATEGORIES_BY_ID.replace(':id', id));
};

export async function getOrderMenu(): Promise<FullMenuCategory[]> {
  const response = await apiClient.get<FullMenuCategory[]>(
    API_PATHS.CATEGORIES_ORDER_MENU,
  );
  return response.data;
}

const categoryService = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrderMenu,
};

export default categoryService;

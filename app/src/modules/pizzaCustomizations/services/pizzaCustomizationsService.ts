import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { PaginatedResponse } from '@/app/types/api.types';
import type { PizzaCustomization } from '../types/pizzaCustomization.types';
import type {
  PizzaCustomizationFormInputs,
  FindAllPizzaCustomizationsQuery,
} from '../schema/pizzaCustomization.schema';

async function findAll(
  params?: FindAllPizzaCustomizationsQuery,
): Promise<PaginatedResponse<PizzaCustomization>> {
  const response = await apiClient.get<{
    items: PizzaCustomization[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.PIZZA_CUSTOMIZATIONS, params);

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
}

async function findOne(id: string): Promise<PizzaCustomization> {
  const response = await apiClient.get<PizzaCustomization>(
    API_PATHS.PIZZA_CUSTOMIZATIONS_BY_ID.replace(':id', id),
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function create(
  data: PizzaCustomizationFormInputs,
): Promise<PizzaCustomization> {
  const response = await apiClient.post<PizzaCustomization>(
    API_PATHS.PIZZA_CUSTOMIZATIONS,
    data,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function update(
  id: string,
  data: Partial<PizzaCustomizationFormInputs>,
): Promise<PizzaCustomization> {
  const response = await apiClient.patch<PizzaCustomization>(
    API_PATHS.PIZZA_CUSTOMIZATIONS_BY_ID.replace(':id', id),
    data,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function remove(id: string): Promise<void> {
  const response = await apiClient.delete(
    API_PATHS.PIZZA_CUSTOMIZATIONS_BY_ID.replace(':id', id),
  );

  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

async function updateSortOrder(
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  const response = await apiClient.patch(
    API_PATHS.PIZZA_CUSTOMIZATIONS_SORT_ORDER,
    { updates },
  );

  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

export const pizzaCustomizationsService = {
  findAll,
  findOne,
  create,
  update,
  remove,
  updateSortOrder,
};

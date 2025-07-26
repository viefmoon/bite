import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { PaginatedResponse } from '@/app/types/api.types';
import type { PizzaCustomization } from '../schema/pizzaCustomization.schema';
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
  }>(API_PATHS.PIZZA_CUSTOMIZATIONS, { params });

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
  return response.data;
}

async function create(
  data: PizzaCustomizationFormInputs,
): Promise<PizzaCustomization> {
  const response = await apiClient.post<PizzaCustomization>(
    API_PATHS.PIZZA_CUSTOMIZATIONS,
    data,
  );
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
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(
    API_PATHS.PIZZA_CUSTOMIZATIONS_BY_ID.replace(':id', id),
  );
}

async function updateSortOrder(
  updates: { id: string; sortOrder: number }[],
): Promise<void> {
  await apiClient.patch(API_PATHS.PIZZA_CUSTOMIZATIONS_SORT_ORDER, { updates });
}

export const pizzaCustomizationsService = {
  findAll,
  findOne,
  create,
  update,
  remove,
  updateSortOrder,
};

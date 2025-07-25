import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Product,
  ProductFormInputs,
  FindAllProductsQuery,
  AssignModifierGroupsInput,
} from '../schema/products.schema';
import { PaginatedResponse } from '@/app/types/api.types';

async function findAll(
  params: FindAllProductsQuery,
): Promise<PaginatedResponse<Product>> {
  const response = await apiClient.get<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>(API_PATHS.PRODUCTS, { params });

  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
}

async function findOne(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(
    API_PATHS.PRODUCTS_BY_ID.replace(':id', id),
  );
  return response.data;
}

async function create(data: ProductFormInputs): Promise<Product> {
  const response = await apiClient.post<Product>(API_PATHS.PRODUCTS, data);
  return response.data;
}

async function update(
  id: string,
  data: Partial<ProductFormInputs>,
): Promise<Product> {
  const response = await apiClient.patch<Product>(
    API_PATHS.PRODUCTS_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
}

async function remove(id: string): Promise<void> {
  await apiClient.delete(API_PATHS.PRODUCTS_BY_ID.replace(':id', id));
}

async function assignModifierGroups(
  productId: string,
  data: AssignModifierGroupsInput,
): Promise<Product> {
  const response = await apiClient.post<Product>(
    API_PATHS.PRODUCTS_MODIFIER_GROUPS.replace(':productId', productId),
    data,
  );
  return response.data;
}

async function getModifierGroups(productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(
    API_PATHS.PRODUCTS_MODIFIER_GROUPS.replace(':productId', productId),
  );
  return response.data;
}

async function removeModifierGroups(
  productId: string,
  data: AssignModifierGroupsInput,
): Promise<Product> {
  const response = await apiClient.delete<Product>(
    API_PATHS.PRODUCTS_MODIFIER_GROUPS.replace(':productId', productId),
    data,
  );
  return response.data;
}

async function findAllPizzas(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>(API_PATHS.PRODUCTS_PIZZAS);
  return response.data;
}

async function getPizzaCustomizations(productId: string): Promise<any[]> {
  const response = await apiClient.get<any[]>(
    API_PATHS.PRODUCTS_PIZZA_CUSTOMIZATIONS.replace(':productId', productId),
  );
  return response.data;
}

async function updatePizzaCustomizations(
  productId: string,
  pizzaCustomizationIds: string[],
): Promise<Product> {
  const response = await apiClient.put<Product>(
    API_PATHS.PRODUCTS_PIZZA_CUSTOMIZATIONS.replace(':productId', productId),
    pizzaCustomizationIds,
  );
  return response.data;
}

async function bulkUpdatePizzaCustomizations(
  updates: Array<{ productId: string; customizationIds: string[] }>,
): Promise<void> {
  await apiClient.put(API_PATHS.PRODUCTS_PIZZAS_CUSTOMIZATIONS_BULK, {
    updates,
  });
}

export const productsService = {
  findAll,
  findOne,
  create,
  update,
  remove,
  assignModifierGroups,
  getModifierGroups,
  removeModifierGroups,
  findAllPizzas,
  getPizzaCustomizations,
  updatePizzaCustomizations,
  bulkUpdatePizzaCustomizations,
};

import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  Product,
  ProductFormInputs,
  FindAllProductsQuery,
  AssignModifierGroupsInput,
} from '../schema/products.schema'; // Corregida ruta de importación
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
  }>(API_PATHS.PRODUCTS, params);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  // Transforma la respuesta del backend a PaginatedResponse
  return {
    data: response.data.items,
    total: response.data.total,
    page: response.data.page,
    limit: response.data.limit,
    totalPages: Math.ceil(response.data.total / response.data.limit),
  };
}

async function findOne(id: string): Promise<Product> {
  const response = await apiClient.get<Product>(`${API_PATHS.PRODUCTS}/${id}`);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function create(data: ProductFormInputs): Promise<Product> {
  const response = await apiClient.post<Product>(API_PATHS.PRODUCTS, data);

  if (!response.ok) {
    // Verificar si tenemos un ApiError preservado
    if ((response as any).apiError instanceof ApiError) {
      throw (response as any).apiError;
    }

    // Verificar si el error original del interceptor es un ApiError
    if (response.originalError instanceof ApiError) {
      throw response.originalError;
    }

    // Si no hay originalError, crear uno desde la respuesta
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data!;
}

async function update(
  id: string,
  data: Partial<ProductFormInputs>,
): Promise<Product> {
  const response = await apiClient.patch<Product>(
    `${API_PATHS.PRODUCTS}/${id}`,
    data,
  );

  if (!response.ok) {
    // Verificar si tenemos un ApiError preservado
    if ((response as any).apiError instanceof ApiError) {
      throw (response as any).apiError;
    }

    // Verificar si el error original del interceptor es un ApiError
    if (response.originalError instanceof ApiError) {
      throw response.originalError;
    }

    // Si no hay originalError, crear uno desde la respuesta
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data!;
}

async function remove(id: string): Promise<void> {
  const response = await apiClient.delete(`${API_PATHS.PRODUCTS}/${id}`);
  if (!response.ok) {
    // No esperamos 'data' en un 204 No Content, pero sí puede haber error
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  // No se retorna nada en caso de éxito (204 No Content)
}

async function assignModifierGroups(
  productId: string,
  data: AssignModifierGroupsInput,
): Promise<Product> {
  const response = await apiClient.post<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`,
    data,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function getModifierGroups(productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function removeModifierGroups(
  productId: string,
  data: AssignModifierGroupsInput,
): Promise<Product> {
  const response = await apiClient.delete<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`,
    data,
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function findAllPizzas(): Promise<Product[]> {
  const response = await apiClient.get<Product[]>(API_PATHS.PRODUCTS_PIZZAS);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function getPizzaIngredients(productId: string): Promise<any[]> {
  const response = await apiClient.get<any[]>(`${API_PATHS.PRODUCTS}/${productId}/pizza-ingredients`);
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function updatePizzaIngredients(productId: string, pizzaIngredientIds: string[]): Promise<Product> {
  const response = await apiClient.put<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/pizza-ingredients`,
    { pizzaIngredientIds }
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function bulkUpdatePizzaIngredients(
  updates: Array<{ productId: string; ingredientIds: string[] }>
): Promise<void> {
  const response = await apiClient.put(
    `${API_PATHS.PRODUCTS}/pizzas/ingredients/bulk`,
    { updates }
  );
  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
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
  getPizzaIngredients,
  updatePizzaIngredients,
  bulkUpdatePizzaIngredients,
};

import apiClient from "@/app/services/apiClient";
import { ApiError } from "@/app/lib/errors";
import { API_PATHS } from "@/app/constants/apiPaths";
import {
  Product,
  ProductFormInputs,
  FindAllProductsQuery,
  ProductsListResponse,
  AssignModifierGroupsInput,
} from "../schema/products.schema"; // Corregida ruta de importación


async function findAll(
  params: FindAllProductsQuery
): Promise<ProductsListResponse> {
  const response = await apiClient.get<ProductsListResponse>(
    API_PATHS.PRODUCTS,
    params
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
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
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function update(
  id: string,
  data: Partial<ProductFormInputs>
): Promise<Product> {
  const response = await apiClient.patch<Product>(
    `${API_PATHS.PRODUCTS}/${id}`,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
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
  data: AssignModifierGroupsInput
): Promise<Product> {
  const response = await apiClient.post<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function getModifierGroups(productId: string): Promise<Product> {
  const response = await apiClient.get<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
}

async function removeModifierGroups(
  productId: string,
  data: AssignModifierGroupsInput
): Promise<Product> {
  const response = await apiClient.delete<Product>(
    `${API_PATHS.PRODUCTS}/${productId}/modifier-groups`,
    data
  );
  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
  return response.data;
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
};

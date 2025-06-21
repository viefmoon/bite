import apiClient from '@/app/services/apiClient';
import { ApiError } from '@/app/lib/errors';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { PizzaConfiguration } from '../types/pizzaConfiguration.types';
import type {
  PizzaConfigurationFormInputs,
  UpdatePizzaConfigurationInputs,
} from '../schema/pizzaConfiguration.schema';

async function findByProductId(productId: string): Promise<PizzaConfiguration | null> {
  const response = await apiClient.get<PizzaConfiguration>(
    `${API_PATHS.PIZZA_CONFIGURATIONS}/product/${productId}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function create(data: PizzaConfigurationFormInputs): Promise<PizzaConfiguration> {
  const response = await apiClient.post<PizzaConfiguration>(
    API_PATHS.PIZZA_CONFIGURATIONS,
    data
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function update(
  id: string,
  data: UpdatePizzaConfigurationInputs
): Promise<PizzaConfiguration> {
  const response = await apiClient.patch<PizzaConfiguration>(
    `${API_PATHS.PIZZA_CONFIGURATIONS}/${id}`,
    data
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

async function remove(id: string): Promise<void> {
  const response = await apiClient.delete(`${API_PATHS.PIZZA_CONFIGURATIONS}/${id}`);

  if (!response.ok) {
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

export const pizzaConfigurationsService = {
  findByProductId,
  create,
  update,
  remove,
};
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import type { PizzaConfiguration } from '../schema/pizzaConfiguration.schema';
import type {
  PizzaConfigurationFormInputs,
  UpdatePizzaConfigurationInputs,
} from '../schema/pizzaConfiguration.schema';

async function findByProductId(
  productId: string,
): Promise<PizzaConfiguration | null> {
  try {
    const response = await apiClient.get<PizzaConfiguration>(
      API_PATHS.PIZZA_CONFIGURATIONS + '/product/' + productId,
    );
    return response.data;
  } catch (error: any) {
    // Si es un error 404, retornar null en lugar de lanzar error
    if (error.status === 404) {
      return null;
    }
    // Para otros errores, re-lanzar para que el interceptor los maneje
    throw error;
  }
}

async function create(
  data: PizzaConfigurationFormInputs,
): Promise<PizzaConfiguration> {
  const response = await apiClient.post<PizzaConfiguration>(
    API_PATHS.PIZZA_CONFIGURATIONS,
    data,
  );
  return response.data;
}

async function update(
  id: string,
  data: UpdatePizzaConfigurationInputs,
): Promise<PizzaConfiguration> {
  const response = await apiClient.patch<PizzaConfiguration>(
    API_PATHS.PIZZA_CONFIGURATIONS_BY_ID.replace(':id', id),
    data,
  );
  return response.data;
}

export const pizzaConfigurationsService = {
  findByProductId,
  create,
  update,
};

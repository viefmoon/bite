import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { PaginatedParams, PaginatedResponse } from '@/app/types/api.types';
import { handleApiResponse } from '@/app/lib/apiHelpers';
import type {
  PizzaIngredient,
  CreatePizzaIngredientDto,
  UpdatePizzaIngredientDto,
} from '../types/pizzaIngredient.types';

class PizzaIngredientsService {
  async getAll(
    params?: PaginatedParams,
  ): Promise<PaginatedResponse<PizzaIngredient>> {
    const response = await apiClient.get<PaginatedResponse<PizzaIngredient>>(
      API_PATHS.PIZZA_INGREDIENTS,
      { params },
    );
    return handleApiResponse(response);
  }

  async getById(id: string): Promise<PizzaIngredient> {
    const response = await apiClient.get<PizzaIngredient>(
      `${API_PATHS.PIZZA_INGREDIENTS}/${id}`,
    );
    return handleApiResponse(response);
  }

  async create(
    data: CreatePizzaIngredientDto,
  ): Promise<PizzaIngredient> {
    const response = await apiClient.post<PizzaIngredient>(
      API_PATHS.PIZZA_INGREDIENTS,
      data,
    );
    return handleApiResponse(response);
  }

  async update(
    id: string,
    data: UpdatePizzaIngredientDto,
  ): Promise<PizzaIngredient> {
    const response = await apiClient.patch<PizzaIngredient>(
      `${API_PATHS.PIZZA_INGREDIENTS}/${id}`,
      data,
    );
    return handleApiResponse(response);
  }

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(
      `${API_PATHS.PIZZA_INGREDIENTS}/${id}`,
    );
    return handleApiResponse(response);
  }

  async toggleActive(id: string, isActive: boolean): Promise<PizzaIngredient> {
    return this.update(id, { isActive });
  }
}

export const pizzaIngredientsService = new PizzaIngredientsService();
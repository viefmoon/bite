import ApiClientWrapper from '../../../app/services/apiClientWrapper';
import { ApiError } from '../../../app/lib/errors';
import { API_PATHS } from '../../../app/constants/apiPaths';
import {
  BackendErrorResponse,
  PaginatedResponse,
} from '../../../app/types/api.types';
import { BaseListQuery } from '../../../app/types/query.types';
import {
  PreparationScreen,
  CreatePreparationScreenDto,
  UpdatePreparationScreenDto,
  FindAllPreparationScreensDto,
} from '../schema/preparationScreen.schema';

/**
 * Fetches a list of preparation screens based on filter and pagination options.
 * @param filterOptions - Options to filter the results (e.g., by name, isActive).
 * @param paginationOptions - Options for pagination (page number, limit).
 * @returns A promise that resolves to a paginated response of PreparationScreen objects.
 * @throws {ApiError} If the API request fails.
 */
export const getPreparationScreens = async (
  filterOptions: FindAllPreparationScreensDto = {},
  paginationOptions: BaseListQuery = { page: 1, limit: 15 }, // Default limit 15
): Promise<PaginatedResponse<PreparationScreen>> => {
  const response = await ApiClientWrapper.get<
    PaginatedResponse<PreparationScreen>
  >(API_PATHS.PREPARATION_SCREENS, {
    ...filterOptions,
    page: paginationOptions.page,
    limit: paginationOptions.limit,
  });

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }

  // Verificar que la respuesta tenga la estructura esperada del backend paginado
  if (
    typeof response.data === 'object' &&
    'items' in response.data &&
    Array.isArray(response.data.items) &&
    'total' in response.data &&
    'page' in response.data &&
    'limit' in response.data
  ) {
    // Convertir de la estructura del backend a PaginatedResponse
    return {
      data: response.data.items,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
      totalPages: Math.ceil(response.data.total / response.data.limit),
    };
  } else {
    throw new Error('Invalid response format from API');
  }
};

/**
 * Fetches a single preparation screen by its ID.
 * @param id - The UUID of the preparation screen.
 * @returns A promise that resolves to the PreparationScreen object.
 * @throws {ApiError} If the API request fails or the screen is not found.
 */
export const getPreparationScreenById = async (
  id: string,
): Promise<PreparationScreen> => {
  const response = await ApiClientWrapper.get<PreparationScreen>(
    `${API_PATHS.PREPARATION_SCREENS}/${id}`,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

/**
 * Creates a new preparation screen.
 * @param data - The data for the new preparation screen (CreatePreparationScreenDto).
 * @returns A promise that resolves to the newly created PreparationScreen object.
 * @throws {ApiError} If the API request fails.
 */
export const createPreparationScreen = async (
  data: CreatePreparationScreenDto,
): Promise<PreparationScreen> => {
  const response = await ApiClientWrapper.post<PreparationScreen>(
    API_PATHS.PREPARATION_SCREENS,
    data,
  );

  if (!response.ok || !response.data) {
    // Si hay un ApiError original del interceptor, usarlo directamente
    if ((response as any).apiError instanceof ApiError) {
      throw (response as any).apiError;
    }
    
    // Si no, crear uno nuevo desde la respuesta
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

/**
 * Updates an existing preparation screen.
 * @param id - The UUID of the preparation screen to update.
 * @param data - The data to update (UpdatePreparationScreenDto).
 * @returns A promise that resolves to the updated PreparationScreen object.
 * @throws {ApiError} If the API request fails or the screen is not found.
 */
export const updatePreparationScreen = async (
  id: string,
  data: UpdatePreparationScreenDto,
): Promise<PreparationScreen> => {
  const response = await ApiClientWrapper.patch<PreparationScreen>(
    `${API_PATHS.PREPARATION_SCREENS}/${id}`,
    data,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

/**
 * Deletes a preparation screen by its ID (soft delete likely).
 * @param id - The UUID of the preparation screen to delete.
 * @returns A promise that resolves when the deletion is successful.
 * @throws {ApiError} If the API request fails.
 */
export const deletePreparationScreen = async (id: string): Promise<void> => {
  const response = await ApiClientWrapper.delete(
    `${API_PATHS.PREPARATION_SCREENS}/${id}`,
  );

  if (!response.ok) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
};

/**
 * Gets products associated with a preparation screen.
 * @param id - The UUID of the preparation screen.
 * @returns A promise that resolves to an array of products.
 * @throws {ApiError} If the API request fails.
 */
export const getPreparationScreenProducts = async (
  id: string,
): Promise<any[]> => {
  const response = await ApiClientWrapper.get<any[]>(
    `${API_PATHS.PREPARATION_SCREENS}/${id}/products`,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

/**
 * Gets the complete menu with association information for a preparation screen.
 * @param id - The UUID of the preparation screen.
 * @returns A promise that resolves to the menu data with associations.
 * @throws {ApiError} If the API request fails.
 */
export const getMenuWithAssociations = async (id: string): Promise<any> => {
  const response = await ApiClientWrapper.get<any>(
    `${API_PATHS.PREPARATION_SCREENS}/${id}/menu-with-associations`,
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

/**
 * Associates products with a preparation screen.
 * @param id - The UUID of the preparation screen.
 * @param productIds - Array of product IDs to associate.
 * @returns A promise that resolves to the updated preparation screen.
 * @throws {ApiError} If the API request fails.
 */
export const associateProducts = async (
  id: string,
  productIds: string[],
): Promise<PreparationScreen> => {
  const response = await ApiClientWrapper.post<PreparationScreen>(
    `${API_PATHS.PREPARATION_SCREENS}/${id}/products`,
    { productIds },
  );

  if (!response.ok || !response.data) {
    throw ApiError.fromApiResponse(
      response.data as BackendErrorResponse | undefined,
      response.status,
    );
  }
  return response.data;
};

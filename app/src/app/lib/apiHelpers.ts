import { ApiResponse } from 'apisauce';
import { ApiError } from './errors';

/**
 * Helper function to handle API responses consistently.
 * If the response is not ok, it extracts the error from the response.
 *
 * @param response - The API response from apisauce
 * @returns The response data if successful
 * @throws ApiError if the response is not ok
 */
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  // Caso especial: si data es un array vacío, es una respuesta válida
  if (
    response.ok &&
    Array.isArray(response.data) &&
    response.data.length === 0
  ) {
    return response.data;
  }

  if (!response.ok || !response.data) {
    // Check if the originalError is already an ApiError (from interceptor)
    if (response.originalError && response.originalError instanceof ApiError) {
      throw response.originalError;
    }

    // Otherwise, create a new ApiError from the response
    throw ApiError.fromApiResponse(response.data, response.status);
  }

  return response.data;
}

/**
 * Helper function to handle API responses that don't return data.
 *
 * @param response - The API response from apisauce
 * @throws ApiError if the response is not ok
 */
export function handleApiResponseVoid(response: ApiResponse<any>): void {
  if (!response.ok) {
    // Check if the originalError is already an ApiError (from interceptor)
    if (response.originalError && response.originalError instanceof ApiError) {
      throw response.originalError;
    }

    // Otherwise, create a new ApiError from the response
    throw ApiError.fromApiResponse(response.data, response.status);
  }
}

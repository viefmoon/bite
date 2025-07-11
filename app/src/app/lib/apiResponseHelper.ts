import { ApiResponse } from 'apisauce';
import { ApiError } from './errors';
import { BackendErrorResponse } from '../types/api.types';

/**
 * Helper function to handle API error responses consistently
 * If the interceptor already created an ApiError, use it directly
 * Otherwise, create a new one from the response data
 */
export function handleApiError(response: ApiResponse<any>): never {
  // Si hay un apiError ya procesado por el interceptor, usarlo directamente
  if ((response as any).apiError instanceof ApiError) {
    throw (response as any).apiError;
  }
  
  // Si no, crear uno nuevo (fallback)
  throw ApiError.fromApiResponse(
    response.data as BackendErrorResponse | undefined,
    response.status,
  );
}
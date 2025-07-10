import { getApiClient, reinitializeApiClient } from './apiClient';
import { ApiResponse } from 'apisauce';

/**
 * Wrapper que maneja la inicialización asíncrona del cliente API
 * Todos los servicios deben usar este wrapper en lugar de importar apiClient directamente
 */
export class ApiClientWrapper {
  static async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.get(url, params) as Promise<ApiResponse<T>>;
  }

  static async post<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.post(url, data, config) as Promise<ApiResponse<T>>;
  }

  static async put<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.put(url, data, config) as Promise<ApiResponse<T>>;
  }

  static async patch<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.patch(url, data, config) as Promise<ApiResponse<T>>;
  }

  static async delete<T>(
    url: string,
    params?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.delete(url, params, config) as Promise<ApiResponse<T>>;
  }

  static async reinitialize(): Promise<void> {
    await reinitializeApiClient();
  }
}

// Exportar también como default para compatibilidad
export default ApiClientWrapper;

import { getApiClient, reinitializeApiClient } from './apiClient';
import { ApiResponse } from 'apisauce';

/**
 * Wrapper que maneja la inicialización asíncrona del cliente API
 * Todos los servicios deben usar este wrapper en lugar de importar apiClient directamente
 */
export class ApiClientWrapper {
  static async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.get<T>(url, params);
  }

  static async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.post<T>(url, data, config);
  }

  static async put<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.put<T>(url, data, config);
  }

  static async patch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.patch<T>(url, data, config);
  }

  static async delete<T>(url: string, params?: any, config?: any): Promise<ApiResponse<T>> {
    const client = await getApiClient();
    return client.delete<T>(url, params, config);
  }

  static async reinitialize(): Promise<void> {
    await reinitializeApiClient();
  }
}

// Exportar también como default para compatibilidad
export default ApiClientWrapper;
import { getApiClient, reinitializeApiClient, getAxiosInstance } from './apiClient';
import { ApiResponse } from 'apisauce';
import { AxiosResponse } from 'axios';

/**
 * Wrapper que maneja la inicialización asíncrona del cliente API
 * Todos los servicios deben usar este wrapper en lugar de importar apiClient directamente
 */
export class ApiClientWrapper {
  private static async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    dataOrParams?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    try {
      const axios = await getAxiosInstance();
      
      const requestConfig = method === 'get' || method === 'delete'
        ? { params: dataOrParams, ...config }
        : config;
        
      const response: AxiosResponse<T> = await axios[method](url, 
        method === 'get' || method === 'delete' ? requestConfig : dataOrParams, 
        method === 'get' || method === 'delete' ? undefined : requestConfig
      );
      
      return {
        ok: true,
        problem: null,
        data: response.data,
        status: response.status,
        headers: response.headers,
        config: response.config,
        duration: 0,
      } as ApiResponse<T>;
    } catch (error: any) {
      return {
        ok: false,
        problem: error.response?.status === 401 ? 'CLIENT_ERROR' : 'NETWORK_ERROR',
        data: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: error.config,
        duration: 0,
      } as ApiResponse<T>;
    }
  }

  static async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, params);
  }

  static async post<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, config);
  }

  static async put<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, config);
  }

  static async patch<T>(
    url: string,
    data?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, data, config);
  }

  static async delete<T>(
    url: string,
    params?: any,
    config?: any,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, params, config);
  }

  static async reinitialize(): Promise<void> {
    await reinitializeApiClient();
  }
}

// Exportar también como default para compatibilidad
export default ApiClientWrapper;

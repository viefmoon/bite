import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import EncryptedStorage from '@/app/services/secureStorageService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from '../lib/errors';
import axiosRetry from 'axios-retry';
import { discoveryService } from './discoveryService';
import { useSnackbarStore } from '../stores/snackbarStore';
import { API_PATHS } from '../constants/apiPaths';
import { certificateValidator } from './certificateValidator';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

async function refreshToken(baseURL: string): Promise<string> {
  try {
    const currentRefreshToken = await EncryptedStorage.getItem(
      STORAGE_KEYS.REFRESH_TOKEN,
    );
    if (!currentRefreshToken) {
      throw new Error('No refresh token available.');
    }

    const { data } = await axios.post<{ token: string; refreshToken?: string }>(
      `${baseURL}${API_PATHS.AUTH_REFRESH}`,
      {},
      { headers: { Authorization: `Bearer ${currentRefreshToken}` } },
    );

    const authStore = useAuthStore.getState();
    await authStore.setAccessToken(data.token);
    if (data.refreshToken && data.refreshToken !== currentRefreshToken) {
      await authStore.setRefreshToken(data.refreshToken);
    }

    return data.token;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      await useAuthStore.getState().logout();
    }
    throw error;
  }
}

// Crear la instancia de Axios sin baseURL inicial
const apiClient = axios.create({
  headers: {
    'Cache-Control': 'no-cache',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Configurar retry automático
axiosRetry(apiClient, {
  retries: 1,
  retryDelay: () => 500,
  retryCondition: (error: AxiosError) => {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return false;
    }
    return (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNRESET'
    );
  },
  shouldResetTimeout: false,
});

// Promesa de inicialización para asegurar que la baseURL se configure antes de las peticiones
const initializationPromise = (async () => {
  try {
    const baseURL = await discoveryService.getApiUrl();
    if (!baseURL) {
      throw new Error('No se pudo obtener la URL del servidor');
    }
    certificateValidator.validateConnection(baseURL);
    apiClient.defaults.baseURL = baseURL;
    apiClient.defaults.httpsAgent =
      certificateValidator.getAxiosSecurityConfig().httpsAgent;
  } catch (error) {
    // Error al inicializar apiClient
  }
})();

// Interceptor de Peticiones
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Esperar a que la inicialización se complete
    await initializationPromise;

    if (!config.baseURL) {
      throw new axios.Cancel('La URL del servidor no está configurada.');
    }

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.url !== API_PATHS.AUTH_REFRESH) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Configurar timeouts específicos según el tipo de operación
    if (!config.timeout) {
      const timeouts = {
        get: 5000,
        post: config.url?.includes('/files/upload') ? 30000 : 5000,
        put: 5000,
        patch: 5000,
        delete: 5000,
      };

      config.timeout = timeouts[config.method as keyof typeof timeouts] || 5000;
    }

    return config;
  },
  (error: any) => Promise.reject(error),
);

// Interceptor de Respuestas
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Manejar errores de red sin respuesta del servidor
    if (!error.response) {
      let specificError: Error;
      const showSnackbar = useSnackbarStore.getState().showSnackbar;

      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        specificError = new Error('El servidor no responde');
        (specificError as any).code = 'SERVER_TIMEOUT';
      } else if (error.code === 'ECONNREFUSED') {
        specificError = new Error('El servidor está apagado o no accesible');
        (specificError as any).code = 'SERVER_DOWN';
      } else if (
        error.message === 'Network Error' ||
        error.code === 'ENETUNREACH'
      ) {
        specificError = new Error('No se pudo encontrar el servidor CloudBite');
        (specificError as any).code = 'SERVER_NOT_FOUND';
      } else {
        specificError = new Error('Error de conexión de red');
        (specificError as any).code = 'NETWORK_ERROR';
      }

      // Mostrar mensaje de error según el método HTTP
      const method = originalRequest.method?.toLowerCase();
      let errorMessage = 'Sin conexión al servidor';

      if (method === 'post') {
        errorMessage = 'No se puede guardar sin conexión';
      } else if (method === 'put' || method === 'patch') {
        errorMessage = 'No se puede actualizar sin conexión';
      } else if (method === 'delete') {
        errorMessage = 'No se puede eliminar sin conexión';
      } else if (method === 'get') {
        errorMessage = 'No se pueden cargar los datos sin conexión';
      }

      setTimeout(() => {
        showSnackbar({
          message: errorMessage,
          type: 'error',
          duration: 5000,
        });
      }, 100);

      return Promise.reject(ApiError.fromAxiosError(error));
    }

    // Manejo de errores 401 para renovación de token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== API_PATHS.AUTH_REFRESH
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = apiClient.defaults.baseURL!;
        const newAccessToken = await refreshToken(baseURL);
        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        return Promise.reject(ApiError.fromRefreshError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    // Para todos los demás errores, los envolvemos en nuestra clase ApiError
    return Promise.reject(ApiError.fromAxiosError(error));
  },
);

export const reinitializeApiClient = async (url?: string) => {
  const baseURL = url || (await discoveryService.getApiUrl());
  if (baseURL) {
    apiClient.defaults.baseURL = baseURL;
  }
};

export default apiClient;

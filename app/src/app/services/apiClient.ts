import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { create as createApisauceInstance } from 'apisauce';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../lib/errors';
import axiosRetry from 'axios-retry';
import { discoveryService } from './discoveryService';
import { useSnackbarStore } from '../store/snackbarStore';
import { API_PATHS } from '../constants/apiPaths';

const REFRESH_TOKEN_KEY = 'refresh_token';

// Variables para manejar la inicialización del cliente
let axiosInstance: any = null;
let apiClient: any = null;
let initializationPromise: Promise<void> | null = null;
let currentBaseURL: string | null = null;

// Función para inicializar el cliente con la URL descubierta
async function initializeApiClient(providedUrl?: string) {
  // Si ya está inicializado con la misma URL, no reinicializar
  if (apiClient && currentBaseURL && currentBaseURL === providedUrl) {
    return;
  }

  if (initializationPromise && !providedUrl) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      const baseURL = providedUrl || (await discoveryService.getApiUrl());
      currentBaseURL = baseURL;

      // Crear instancia de Axios
      axiosInstance = axios.create({
        baseURL,
        headers: {
          'Cache-Control': 'no-cache',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 5000, // Reducido a 5 segundos por defecto
      });

      // Configurar retry automático
      configureAxiosRetry();

      // Configurar interceptores
      configureInterceptors();

      // Crear cliente Apisauce
      apiClient = createApisauceInstance({
        baseURL, // Apisauce requiere baseURL aunque no lo use
        axiosInstance: axiosInstance as any,
      });

      // Agregar transforms
      addResponseTransforms(apiClient);
    } catch (error) {
      // Limpiar la promesa para permitir reintentos manuales
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

// Función para obtener el cliente inicializado
export async function getApiClient(url?: string) {
  if (!apiClient || (url && url !== currentBaseURL)) {
    await initializeApiClient(url);
  }
  return apiClient;
}

// Función para reinicializar el cliente (útil si cambia la IP del servidor)
export async function reinitializeApiClient(url?: string) {
  axiosInstance = null;
  apiClient = null;
  initializationPromise = null;
  currentBaseURL = null;
  cachedClient = null; // Limpiar también el cache del wrapper
  return initializeApiClient(url);
}

// Configurar retry automático para errores de red
function configureAxiosRetry() {
  if (!axiosInstance) return;

  axiosRetry(axiosInstance, {
    retries: 1, // Solo 1 reintento para fallar más rápido
    retryDelay: (_retryCount: number) => {
      return 500; // Solo 500ms de espera
    },
    retryCondition: (error: AxiosError) => {
      // NO reintentar en timeouts para fallar rápido
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return false;
      }

      // Solo reintentar en errores de red reales
      return (
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNRESET'
      );
    },
    shouldResetTimeout: false, // No resetear timeout
    onRetry: (_retryCount: number, _error: AxiosError, _requestConfig: any) => {
      // Silencioso, sin logs
    },
  });
}

// --- Lógica de Refresco de Token (igual que antes) ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function refreshToken(): Promise<string> {
  try {
    const currentRefreshToken =
      await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      throw new Error('No refresh token available.');
    }

    const baseURL = await discoveryService.getApiUrl();
    const response = await axios.post<{ token: string; refreshToken?: string }>(
      `${baseURL}${API_PATHS.AUTH_REFRESH}`,
      {},
      { headers: { Authorization: `Bearer ${currentRefreshToken}` } },
    );

    const newAccessToken = response.data.token;
    const newRefreshToken = response.data.refreshToken;

    // Actualizar tokens en el store
    const authStore = useAuthStore.getState();

    // Si viene un nuevo refresh token, actualizarlo primero
    if (newRefreshToken && newRefreshToken !== currentRefreshToken) {
      await authStore.setRefreshToken(newRefreshToken);
    }

    // Luego actualizar el access token
    await authStore.setAccessToken(newAccessToken);

    return newAccessToken;
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 404) {
      await useAuthStore.getState().logout();
    }
    throw error;
  }
}

// --- Interceptores de Axios ---
function configureInterceptors() {
  if (!axiosInstance) return;

  // 1. Interceptor de Peticiones
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken && config.url !== API_PATHS.AUTH_REFRESH) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Configurar timeouts específicos según el tipo de operación
      if (config.method === 'get') {
        // GETs con timeout uniforme
        config.timeout = 5000; // 5 segundos para todas las consultas
      } else if (
        config.method === 'post' &&
        config.url?.includes('/files/upload')
      ) {
        // Uploads necesitan más tiempo
        config.timeout = 30000; // 30 segundos para uploads
      } else if (config.method === 'post' || config.method === 'put') {
        // POSTs y PUTs normales
        config.timeout = 5000; // 5 segundos para guardar
      }

      return config;
    },
    (error: any) => Promise.reject(error),
  );

  // 2. Interceptor de Respuestas
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response, // Pasa respuestas exitosas
    async (error: AxiosError) => {
      // Maneja errores
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _skipQueue?: boolean;
      };

      // Detectar errores de red
      if (!error.response) {
        // Crear error más específico
        let specificError: Error;

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          // Error de timeout - el servidor existe pero no responde
          specificError = new Error('El servidor no responde');
          (specificError as any).code = 'SERVER_TIMEOUT';
        } else if (error.code === 'ECONNREFUSED') {
          // Conexión rechazada - el servidor está apagado
          specificError = new Error('El servidor está apagado o no accesible');
          (specificError as any).code = 'SERVER_DOWN';
        } else if (
          error.message === 'Network Error' ||
          error.code === 'ENETUNREACH'
        ) {
          // Error de red - no se puede alcanzar el servidor
          specificError = new Error(
            'No se pudo encontrar el servidor CloudBite',
          );
          (specificError as any).code = 'SERVER_NOT_FOUND';
        } else {
          // Error genérico de red
          specificError = new Error('Error de conexión de red');
          (specificError as any).code = 'NETWORK_ERROR';
        }

        // Asignar el error específico al error original
        (error as any).specificError = specificError;

        // No mostrar snackbar aquí, dejar que el componente lo maneje
        return Promise.reject(error);
      }

      // No intentar renovar si:
      // 1. No es un error 401
      // 2. Es la propia petición de refresh
      // 3. Es la petición de verificación de token (/auth/me)
      // 4. Ya se intentó renovar antes
      if (
        error.response?.status !== 401 ||
        originalRequest.url === API_PATHS.AUTH_REFRESH ||
        originalRequest.url?.includes('/auth/me') ||
        originalRequest._retry
      ) {
        const apiError = ApiError.fromAxiosError(error);
        return Promise.reject(apiError);
      }

      // --- Manejo del 401 ---
      if (isRefreshing) {
        // Encolar petición
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              originalRequest._retry = true;
              resolve(axiosInstance(originalRequest));
            },
            reject: (err) => reject(ApiError.fromAxiosError(err as AxiosError)),
          });
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshToken();
        processQueue(null, newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // Si el error es 401 o 404, ya se habrá cerrado la sesión en refreshToken()
        // Solo necesitamos rechazar la promesa
        return Promise.reject(ApiError.fromRefreshError(refreshError));
      } finally {
        isRefreshing = false;
      }
    },
  );
}

// Función para agregar transforms al cliente
function addResponseTransforms(client: any) {
  client.addResponseTransform((response: any) => {
    // Solo mostrar snackbar para errores de red reales (no errores HTTP)
    const isNetworkError =
      response.problem === 'NETWORK_ERROR' ||
      response.problem === 'TIMEOUT_ERROR' ||
      response.problem === 'CONNECTION_ERROR';

    const isHttpError = response.status && response.status >= 400;

    if (isNetworkError && !isHttpError) {
      const showSnackbar = useSnackbarStore.getState().showSnackbar;

      let errorMessage = 'Sin conexión al servidor';
      const method =
        response.config?.method || response.originalError?.config?.method;

      if (method === 'POST') {
        errorMessage = 'No se puede guardar sin conexión';
      } else if (method === 'PUT') {
        errorMessage = 'No se puede actualizar sin conexión';
      } else if (method === 'DELETE') {
        errorMessage = 'No se puede eliminar sin conexión';
      } else if (method === 'GET') {
        errorMessage = 'No se pueden cargar los datos sin conexión';
      }

      // Usar setTimeout para asegurar que se muestre
      setTimeout(() => {
        showSnackbar({
          message: errorMessage,
          type: 'error',
          duration: 5000,
        });
      }, 100);
    }

    // Si la respuesta no es ok y tenemos un error original del interceptor
    if (!response.ok && response.originalError instanceof ApiError) {
      // Preservar el ApiError original
      (response as any).apiError = response.originalError;
    }
  });
}

// Cache para el cliente inicializado
let cachedClient: any = null;

// Función wrapper que devuelve el cliente real
const createApiClientWrapper = () => {
  const handler = {
    get(_target: any, prop: string) {
      // Retornar una función que inicializa el cliente cuando se necesita
      return async (...args: any[]) => {
        if (!cachedClient) {
          cachedClient = await getApiClient();
        }

        const method = cachedClient[prop];
        if (typeof method === 'function') {
          return method.apply(cachedClient, args);
        }

        return method;
      };
    },
  };

  return new Proxy({}, handler);
};

const apiClientProxy = createApiClientWrapper();

export default apiClientProxy;

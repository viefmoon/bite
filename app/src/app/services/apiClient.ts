import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { create as createApisauceInstance } from 'apisauce';
import { API_URL } from "@env";
import EncryptedStorage from "react-native-encrypted-storage";
import { useAuthStore } from "../store/authStore";
import { ApiError } from "../lib/errors";

const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_REFRESH_PATH = "/api/v1/auth/refresh";

// --- Instancia de Axios (para interceptores) ---
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Cache-Control": "no-cache",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});




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
    console.log("[ApiClient] Iniciando renovación de token...");
    const currentRefreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      console.error("[ApiClient] No hay refresh token disponible");
      throw new Error("No refresh token available.");
    }
    
    console.log("[ApiClient] Enviando solicitud de refresh...");
    const response = await axios.post<{ token: string; refreshToken?: string }>(
      `${API_URL}${AUTH_REFRESH_PATH}`,
      {},
      { headers: { Authorization: `Bearer ${currentRefreshToken}` } }
    );
    
    const newAccessToken = response.data.token;
    const newRefreshToken = response.data.refreshToken;
    
    console.log("[ApiClient] Token renovado exitosamente");
    
    // Actualizar tokens en el store
    const authStore = useAuthStore.getState();
    
    // Si viene un nuevo refresh token, actualizarlo primero
    if (newRefreshToken && newRefreshToken !== currentRefreshToken) {
      console.log("[ApiClient] Actualizando refresh token...");
      await authStore.setRefreshToken(newRefreshToken);
    }
    
    // Luego actualizar el access token
    await authStore.setAccessToken(newAccessToken);
    
    console.log("[ApiClient] Tokens actualizados en el store");
    
    return newAccessToken;
  } catch (error: any) {
    console.error("[ApiClient] Error renovando token:", error.response?.status, error.message);
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log("[ApiClient] Token inválido o backend diferente, cerrando sesión...");
      await useAuthStore.getState().logout();
    }
    throw error;
  }
}

// --- Interceptores de Axios (aplicados a axiosInstance) ---

// 1. Interceptor de Peticiones
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.url !== AUTH_REFRESH_PATH) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Respuestas
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response, // Pasa respuestas exitosas
  async (error: AxiosError) => { // Maneja errores
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log para debug
    if (error.response?.status === 401) {
      console.log("[ApiClient] Error 401 detectado en:", originalRequest.url);
    }

    // No intentar renovar si:
    // 1. No es un error 401
    // 2. Es la propia petición de refresh
    // 3. Es la petición de verificación de token (/auth/me)
    // 4. Ya se intentó renovar antes
    if (error.response?.status !== 401 || 
        originalRequest.url === AUTH_REFRESH_PATH || 
        originalRequest.url?.includes('/auth/me') ||
        originalRequest._retry) {
      const apiError = ApiError.fromAxiosError(error);
      return Promise.reject(apiError);
    }

    // --- Manejo del 401 ---
    if (isRefreshing) {
      console.log("[ApiClient] Ya hay una renovación en curso, encolando petición...");
      // Encolar petición
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            console.log("[ApiClient] Reintentando petición encolada con nuevo token");
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(axiosInstance(originalRequest));
          },
          reject: (err) => reject(ApiError.fromAxiosError(err as AxiosError)),
        });
      });
    }

    console.log("[ApiClient] Iniciando proceso de renovación de token...");
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshToken();
      console.log("[ApiClient] Token renovado, procesando cola de peticiones...");
      processQueue(null, newAccessToken);
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      console.log("[ApiClient] Reintentando petición original con nuevo token");
      return axiosInstance(originalRequest);
    } catch (refreshError: any) {
      console.error("[ApiClient] Fallo al renovar token, rechazando todas las peticiones en cola");
      processQueue(refreshError, null);
      
      // Si el error es 401 o 404, ya se habrá cerrado la sesión en refreshToken()
      // Solo necesitamos rechazar la promesa
      return Promise.reject(ApiError.fromRefreshError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

// --- Crear instancia de Apisauce USANDO la instancia de Axios configurada ---
const apiClient = createApisauceInstance({
  baseURL: API_URL,
  headers: { // Headers base que Apisauce podría usar/mergear
    "Cache-Control": "no-cache",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30000,
  axiosInstance: axiosInstance, // ¡Aquí está la clave!
});

// Agregar un response transform para manejar errores
apiClient.addResponseTransform((response) => {
  // Si la respuesta no es ok y tenemos un error original del interceptor
  if (!response.ok && response.originalError instanceof ApiError) {
    // Preservar el ApiError original
    (response as any).apiError = response.originalError;
  }
});

// Exportamos la instancia de APISAUCE que usa nuestro Axios configurado
export default apiClient;

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
    const currentRefreshToken = await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
    if (!currentRefreshToken) {
      throw new Error("No refresh token available.");
    }
    const response = await axios.post<{ token: string; refreshToken?: string }>(
      `${API_URL}${AUTH_REFRESH_PATH}`,
      {},
      { headers: { Authorization: `Bearer ${currentRefreshToken}` } }
    );
    const newAccessToken = response.data.token;
    const newRefreshToken = response.data.refreshToken;
    await useAuthStore.getState().setAccessToken(newAccessToken);
    if (newRefreshToken && newRefreshToken !== currentRefreshToken) {
      await EncryptedStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      useAuthStore.setState({ refreshToken: newRefreshToken });
    }
    return newAccessToken;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout();
    }
    // Lanzamos un error específico que el interceptor pueda reconocer si es necesario,
    // o simplemente el error original para que fromAxiosError lo maneje.
    throw error; // Lanzamos el error original para que el interceptor lo capture
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

    if (error.response?.status !== 401 || originalRequest.url === AUTH_REFRESH_PATH || originalRequest._retry) {
      // Si no es 401, es refresh, o ya se reintentó -> Rechazar con ApiError
      const apiError = ApiError.fromAxiosError(error);
      return Promise.reject(apiError);
    }

    // --- Manejo del 401 ---
    if (isRefreshing) {
      // Encolar petición
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(axiosInstance(originalRequest)); // Reintentar con Axios
          },
          reject: (err) => reject(ApiError.fromAxiosError(err as AxiosError)), // Rechazar cola con ApiError
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshToken();
      processQueue(null, newAccessToken);
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest); // Devolver promesa del reintento con Axios
    } catch (refreshError: any) {
      processQueue(refreshError, null);
      // Rechazar con ApiError estandarizado para fallo de refresco
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

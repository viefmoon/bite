import apiClient from '../../../app/services/apiClient';
import { ApiError } from '../../../app/lib/errors';
import { Platform } from 'react-native';
import { API_PATHS } from '../../../app/constants/apiPaths';
import NetInfo from '@react-native-community/netinfo';

export interface FileUploadResponse {
  file: {
    id: string;
    path: string;
  };
  presignedUrl?: string;
}

export interface FileObject {
  uri: string;
  name: string;
  type: string;
}

// Verificar conectividad antes de intentar subir
const checkNetworkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};

export const uploadFile = async (
  fileToUpload: FileObject,
  maxRetries: number = 3,
): Promise<FileUploadResponse> => {
  // Verificar conexión antes de intentar
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new ApiError(
      'NETWORK_ERROR',
      'Sin conexión a internet. Verifica tu conexión e intenta nuevamente.',
      0,
    );
  }

  const formData = new FormData();
  formData.append('file', {
    uri:
      Platform.OS === 'android'
        ? fileToUpload.uri
        : fileToUpload.uri.replace('file://', ''),
    name: fileToUpload.name,
    type: fileToUpload.type,
  } as any);

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiClient.post<FileUploadResponse>(
        API_PATHS.FILES_UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // Agregar header para evitar problemas de caché
            'Cache-Control': 'no-cache',
          },
          timeout: 120000, // Aumentar timeout a 2 minutos para uploads
          // Configuración adicional para mejorar la estabilidad
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      if (!response.ok || !response.data || !response.data.file) {
        lastError = ApiError.fromApiResponse(response.data, response.status);

        // Si no es un error de red, no reintentar
        if (response.status && response.status < 500) {
          throw lastError;
        }

        // Esperar antes de reintentar (backoff exponencial)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response.data;
    } catch (error) {
      lastError = error;

      // Si es un error de cliente (4xx), no reintentar
      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw error;
      }

      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
          'UPLOAD_FAILED',
          `Error al subir archivo después de ${maxRetries} intentos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          500,
        );
      }

      // Esperar antes de reintentar (backoff exponencial)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Por si acaso llegamos aquí
  throw (
    lastError ||
    new ApiError('UPLOAD_FAILED', 'Error desconocido al subir archivo', 500)
  );
};

const fileService = {
  uploadFile,
  uploadImage: uploadFile,
};

export default fileService;

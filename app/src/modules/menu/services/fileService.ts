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

const checkNetworkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
};

export const uploadFile = async (
  fileToUpload: FileObject,
  maxRetries: number = 3,
): Promise<FileUploadResponse> => {
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
            'Cache-Control': 'no-cache',
          },
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      return response.data;
    } catch (error) {
      lastError = error;

      if (
        error instanceof ApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
          'UPLOAD_FAILED',
          `Error al subir archivo después de ${maxRetries} intentos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          500,
        );
      }

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw (
    lastError ||
    new ApiError('UPLOAD_FAILED', 'Error desconocido al subir archivo', 500)
  );
};

const fileService = {
  uploadFile,
};

export default fileService;

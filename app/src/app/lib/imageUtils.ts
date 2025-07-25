import { serverConnectionService } from '@/services/serverConnectionService';

/**
 * Helper function para normalizar y construir URLs de imagen
 */
const buildImageUrl = (imagePath: string, apiUrl: string): string | null => {
  const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const normalizedPath = imagePath.replace(/\\/g, '/');

  if (normalizedPath.startsWith('http')) {
    try {
      const urlObj = new URL(normalizedPath);
      return `${normalizedApiUrl}${urlObj.pathname}`;
    } catch {
      return null;
    }
  }

  const formattedPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${normalizedApiUrl}${formattedPath}`;
};

/**
 * Construye la URL completa de una imagen a partir de su ruta relativa o absoluta.
 * @param imagePath - La ruta relativa o URL completa de la imagen.
 * @returns Promise con la URL completa y lista para usar, o null si la entrada es inválida.
 */
export const getImageUrl = async (
  imagePath: string | null | undefined,
): Promise<string | null> => {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  try {
    const connectionState = serverConnectionService.getState();
    if (!connectionState.currentUrl || !connectionState.isConnected) {
      return null;
    }

    return buildImageUrl(imagePath, connectionState.currentUrl);
  } catch (error) {
    return null;
  }
};

/**
 * Versión síncrona que usa una URL base proporcionada.
 * @param imagePath - La ruta relativa o URL completa de la imagen.
 * @param apiUrl - La URL base del API.
 * @returns La URL completa y lista para usar, o null si la entrada es inválida.
 */
export const getImageUrlSync = (
  imagePath: string | null | undefined,
  apiUrl: string,
): string | null => {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  return buildImageUrl(imagePath, apiUrl);
};


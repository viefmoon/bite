import { serverConnectionService } from '@/app/services/serverConnectionService';
import { useServerUrlStore } from '@/app/stores/serverUrlStore';

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
 * Versión síncrona que usa el store global para obtener la URL del servidor.
 * Esta es la versión preferida para evitar llamadas asíncronas en renderizado.
 * @param imagePath - La ruta relativa o URL completa de la imagen.
 * @returns La URL completa y lista para usar, o null si la entrada es inválida.
 */
export const getImageUrlFromStore = (
  imagePath: string | null | undefined,
): string | null => {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  const serverUrl = useServerUrlStore.getState().serverUrl;
  if (!serverUrl) {
    return null;
  }

  return buildImageUrl(imagePath, serverUrl);
};

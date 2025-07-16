import { serverConnectionService } from '@/services/serverConnectionService';

/**
 * Construye la URL completa de una imagen a partir de su ruta relativa o absoluta.
 * Si la ruta ya es una URL completa (http/https) o URI local (file://), la devuelve tal cual.
 * Si es una ruta relativa, la prefija con la URL del API obtenida dinámicamente.
 * @param imagePath - La ruta relativa (ej. 'uploads/imagen.jpg') o URL completa de la imagen.
 * @returns Promise con la URL completa y lista para usar, o null si la entrada es inválida.
 */
export const getImageUrl = async (
  imagePath: string | null | undefined,
): Promise<string | null> => {
  if (!imagePath || typeof imagePath !== 'string') {
    return null;
  }

  try {
    // Obtener la URL del servicio de conexión sin provocar discovery
    const connectionState = serverConnectionService.getState();
    if (!connectionState.serverUrl || !connectionState.isConnected) {
      return null;
    }

    const apiUrl = connectionState.serverUrl;
    const normalizedApiUrl = apiUrl.endsWith('/')
      ? apiUrl.slice(0, -1)
      : apiUrl;
    const normalizedPath = imagePath.replace(/\\/g, '/');

    if (normalizedPath.startsWith('http')) {
      const urlObj = new URL(normalizedPath);
      const pathPart = urlObj.pathname;

      return `${normalizedApiUrl}${pathPart}`;
    }
    const formattedPath = normalizedPath.startsWith('/')
      ? normalizedPath
      : `/${normalizedPath}`;

    return `${normalizedApiUrl}${formattedPath}`;
  } catch (error) {
    return null;
  }
};

/**
 * Versión síncrona que usa una URL base proporcionada.
 * Útil cuando ya tienes la URL del API disponible.
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

  const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const normalizedPath = imagePath.replace(/\\/g, '/');

  if (normalizedPath.startsWith('http')) {
    const urlObj = new URL(normalizedPath);
    const pathPart = urlObj.pathname;

    return `${normalizedApiUrl}${pathPart}`;
  }
  const formattedPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${normalizedApiUrl}${formattedPath}`;
};

/**
 * Limpia el cache de la URL del API.
 * Útil cuando se necesita forzar una nueva búsqueda del servidor.
 */
export const clearApiUrlCache = () => {
  cachedApiUrl = null;
  cacheTimestamp = 0;
};

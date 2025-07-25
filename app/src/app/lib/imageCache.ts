import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { API_PATHS } from '@/app/constants/apiPaths';

const CACHE_DIR = `${FileSystem.cacheDirectory}image-cache/`;
const MAX_CACHE_SIZE_MB = 500;
const MAX_CACHE_AGE_DAYS = 7;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1 segundo

// Función para realizar descargas con retry y backoff exponencial
async function downloadWithRetry(
  remoteUrl: string,
  localUri: string,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = BASE_RETRY_DELAY,
): Promise<string | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        remoteUrl,
        localUri,
      );

      return downloadedUri;
    } catch (error) {
      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

async function ensureCacheDirExists() {
  if (Platform.OS === 'web') return;

  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function getCacheFilename(remoteUrl: string): Promise<string> {
  let urlToHash = remoteUrl;

  // Incluir el host en el hash para URLs de nuestra API
  if (remoteUrl.includes(API_PATHS.FILES_CHECK)) {
    try {
      const parsedUrl = new URL(remoteUrl);
      urlToHash = `${parsedUrl.host}${parsedUrl.pathname}`;
    } catch {
      urlToHash = remoteUrl;
    }
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    urlToHash,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  const extensionMatch = remoteUrl.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  return `${digest}.${extension}`;
}

interface ExistingFileInfo {
  uri: string;
  size: number;
  modificationTime: number;
  exists: true;
}

async function cleanCache() {
  await ensureCacheDirExists();

  try {
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);

    if (files.length === 0) {
      return;
    }

    const fileInfosPromises = files.map(
      async (
        file,
      ): Promise<ExistingFileInfo | { exists: false; uri: string }> => {
        const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`, {
          size: true,
        });
        if (info.exists) {
          return {
            uri: info.uri,
            size: info.size,
            modificationTime: info.modificationTime,
            exists: true,
          };
        } else {
          return {
            exists: false,
            uri: info.uri,
          };
        }
      },
    );

    const allFileInfos = await Promise.all(fileInfosPromises);
    const existingFileInfos: ExistingFileInfo[] = allFileInfos.filter(
      (f): f is ExistingFileInfo => f.exists,
    );

    let totalSize = existingFileInfos.reduce((sum, file) => sum + file.size, 0);

    const now = Date.now();
    const maxAgeMillis = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
    const maxSizeInBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    // Fase 1: Eliminar archivos por edad (más eficiente)
    const filesToDeleteByAge = existingFileInfos.filter((file) => {
      const fileAgeMillis = now - Math.floor(file.modificationTime) * 1000;
      return fileAgeMillis > maxAgeMillis;
    });

    for (const file of filesToDeleteByAge) {
      try {
        await FileSystem.deleteAsync(file.uri, { idempotent: true });
        totalSize -= file.size;
      } catch {
        // Ignorar errores de archivos que no se pueden eliminar
      }
    }

    // Fase 2: Eliminar archivos por tamaño si es necesario (LRU)
    if (totalSize > maxSizeInBytes) {
      const remainingFiles = existingFileInfos
        .filter((file) => {
          const fileAgeMillis = now - Math.floor(file.modificationTime) * 1000;
          return fileAgeMillis <= maxAgeMillis;
        })
        .sort((a, b) => {
          // Ordenar por tiempo de modificación (más antiguos primero)
          return a.modificationTime < b.modificationTime
            ? -1
            : a.modificationTime > b.modificationTime
              ? 1
              : 0;
        });

      // Eliminar archivos más antiguos hasta llegar al límite de tamaño
      // Dejamos un margen del 10% para evitar limpiezas frecuentes
      const targetSize = maxSizeInBytes * 0.9;

      for (const file of remainingFiles) {
        if (totalSize <= targetSize) break;

        try {
          await FileSystem.deleteAsync(file.uri, { idempotent: true });
          totalSize -= file.size;
        } catch {
          // Ignorar errores de archivos que no se pueden eliminar
        }
      }
    }
  } catch (error) {
    // Silently ignore cache clean errors
  }
}

export async function getCachedImageUri(
  remoteUrl: string,
): Promise<string | null> {
  if (
    !remoteUrl ||
    typeof remoteUrl !== 'string' ||
    (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://'))
  ) {
    return remoteUrl;
  }

  // En web, no usar cache - devolver URL directamente
  if (Platform.OS === 'web') {
    return remoteUrl;
  }

  await ensureCacheDirExists();
  const filename = await getCacheFilename(remoteUrl);
  const localUri = `${CACHE_DIR}${filename}`;
  const fileInfo = await FileSystem.getInfoAsync(localUri);

  if (fileInfo.exists) {
    return localUri;
  } else {
    const downloadedUri = await downloadWithRetry(remoteUrl, localUri);

    if (downloadedUri) {
      return downloadedUri;
    } else {
      // Limpiar archivos parciales si los hay
      const partialFileInfo = await FileSystem.getInfoAsync(localUri);
      if (partialFileInfo.exists) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      }

      return null;
    }
  }
}

export async function initImageCache() {
  // En web, no inicializar cache
  if (Platform.OS === 'web') {
    return;
  }

  await ensureCacheDirExists();

  cleanCache().catch(() => {
    // Silently ignore init errors
  });
}

export async function removeImageFromCache(remoteUrl: string) {
  if (!remoteUrl || typeof remoteUrl !== 'string') return;

  // En web, no hay cache que limpiar
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const filename = await getCacheFilename(remoteUrl);
    const localUri = `${CACHE_DIR}${filename}`;
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (error) {
    // Silently ignore removal errors
  }
}

export async function clearImageCache() {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await ensureCacheDirExists();
  } catch (error) {
    // Silently ignore clear errors
  }
}

// Prefetching inteligente para optimizar la carga de imágenes
export async function prefetchImages(
  imagePaths: string[],
  options: {
    maxConcurrent?: number;
    skipExisting?: boolean;
    onProgress?: (completed: number, total: number) => void;
  } = {},
) {
  const { maxConcurrent = 5, skipExisting = true, onProgress } = options;

  if (!imagePaths || imagePaths.length === 0) {
    return;
  }

  let completed = 0;
  let failed = 0;

  const processSingleImage = async (imagePath: string) => {
    try {
      const { getImageUrlSync } = await import('./imageUtils');
      const { serverConnectionService } = await import(
        '@/services/serverConnectionService'
      );

      const serverUrl = serverConnectionService.getCurrentUrl();
      if (!serverUrl) {
        failed++;
        return;
      }

      const fullUrl = getImageUrlSync(imagePath, serverUrl);
      if (!fullUrl) {
        failed++;
        return;
      }

      if (skipExisting) {
        const filename = await getCacheFilename(fullUrl);
        const localUri = `${CACHE_DIR}${filename}`;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          return;
        }
      }

      const result = await getCachedImageUri(fullUrl);
      if (!result) {
        failed++;
      }
    } catch (error) {
      failed++;
    } finally {
      completed++;
      onProgress?.(completed, imagePaths.length);
    }
  };

  const batches = [];
  for (let i = 0; i < imagePaths.length; i += maxConcurrent) {
    const batch = imagePaths.slice(i, i + maxConcurrent);
    batches.push(batch);
  }

  for (const batch of batches) {
    await Promise.all(batch.map(processSingleImage));
  }

  // Silently ignore prefetch failures
}

export async function prefetchMenuImages(
  menuData: any[],
  options?: {
    maxConcurrent?: number;
    onProgress?: (completed: number, total: number) => void;
  },
) {
  const imagePaths: string[] = [];

  menuData.forEach((category) => {
    if (category.photo?.path) {
      imagePaths.push(category.photo.path);
    }

    if (category.subcategories) {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.photo?.path) {
          imagePaths.push(subcategory.photo.path);
        }

        if (subcategory.products) {
          subcategory.products.forEach((product) => {
            if (product.photo?.path) {
              imagePaths.push(product.photo.path);
            }
          });
        }
      });
    }
  });

  if (imagePaths.length > 0) {
    await prefetchImages(imagePaths, {
      ...options,
      skipExisting: true,
    });
  }
}
